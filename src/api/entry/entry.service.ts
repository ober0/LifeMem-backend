import { Injectable } from '@nestjs/common';
import { FileType } from '@prisma/client';

import type { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { EmbeddingService } from '../embedding/embedding.service';
import { EntryProcessingService } from '../entry-processing/entry-processing.service';
import { EntryPipelinesEnum } from '../entry-processing/pipelines';
import { FilesRepository } from '../files/files.repository';
import { S3Service } from '../s3/s3.service';
import type { BaseEntryDto, BaseEntryUpdateDto } from './dto/base';
import { CreateEntryDto } from './dto/create-entry.dto';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryImageDto } from './dto/entry-images';
import { EntryVoiceDto } from './dto/entry-voices';
import type { EntryDetailResponseDto } from './dto/get-entry-response.dto';
import type { EntrySearchDto } from './dto/search/search-request.dto';
import type { EntrySearchResponseDto } from './dto/search/search-response.dto';
import { EntryImageSource, EntryVoiceSource } from './dto/types';
import { entryMapper } from './entry.mapper';
import { EntryRepository } from './entry.repository';
import { EntrySearchRepository } from './entry-search.repository';
import {
    checkEntryInput,
    checkGeo,
    checkMediaLimit,
    checkPlacesLimit,
    generateDefaultEntryName,
    normalizeMediaDescription,
    toLocationCoords
} from './helpers/entry.helper';
import type { CreateEntryImageInput, CreateEntryVoiceInput } from './types/uploaded-file.type';

@Injectable()
export class EntryService {
    constructor(
        private readonly entryRepository: EntryRepository,
        private readonly filesRepository: FilesRepository,
        private readonly s3Service: S3Service,
        private readonly entryProcessingService: EntryProcessingService,
        private readonly embeddingService: EmbeddingService,
        private readonly entrySearchRepository: EntrySearchRepository
    ) {}

    private validateCreateInput(dto: CreateEntryDto): void {
        checkEntryInput(dto.text, dto.audioId);
        checkMediaLimit(dto.media?.length ?? 0);

        const locations = dto.location ?? [];
        for (const location of locations) {
            checkGeo(location);

            if (location.latitude === undefined || location.longitude === undefined) {
                throw apiError.badRequest('entry.geo_incomplete');
            }
        }

        checkPlacesLimit(dto.placeIds?.length ?? 0, locations.length);
    }

    private async resolveEntryFiles(
        userId: string,
        dto: CreateEntryDto
    ): Promise<{ images: CreateEntryImageInput[]; voice?: CreateEntryVoiceInput }> {
        const media = dto.media ?? [];
        const mediaIds = media.map((item) => item.id);

        if (new Set(mediaIds).size !== mediaIds.length) {
            throw apiError.badRequest('entry.duplicate_media_ids');
        }

        if (dto.audioId && mediaIds.includes(dto.audioId)) {
            throw apiError.badRequest('entry.audio_media_conflict');
        }

        const fileIds = [...mediaIds, ...(dto.audioId ? [dto.audioId] : [])];
        const files = await this.filesRepository.findAttachableFilesByIds(userId, fileIds);

        if (files.length !== fileIds.length) {
            throw apiError.notFound('entry.file_not_found');
        }

        const fileById = new Map(files.map((file) => [file.id, file]));

        for (const id of mediaIds) {
            const file = fileById.get(id)!;
            if (file.type !== FileType.IMAGE && file.type !== FileType.VIDEO) {
                throw apiError.badRequest('entry.invalid_media_file_type');
            }
        }

        if (dto.audioId) {
            const audioFile = fileById.get(dto.audioId)!;
            if (audioFile.type !== FileType.AUDIO) {
                throw apiError.badRequest('entry.invalid_audio_file_type');
            }
        }

        return {
            images: media.map((item) => ({
                fileId: item.id,
                description: normalizeMediaDescription(item.description)
            })),
            voice: dto.audioId ? { fileId: dto.audioId } : undefined
        };
    }

    async create(actor: Actor, dto: CreateEntryDto): Promise<CreateEntryResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        this.validateCreateInput(dto);

        const personIds = dto.personIds ?? [];
        const placeIds = dto.placeIds ?? [];
        const locations = dto.location ?? [];
        const locationCoords = toLocationCoords(locations);

        await this.checkLinkedEntities(userId, personIds, placeIds);

        const { images, voice } = await this.resolveEntryFiles(userId, dto);

        const text = dto.text?.trim() || null;
        const hasLocationCoords = locationCoords.length > 0;
        const hasMedia = images.length > 0;

        const entry = await this.entryRepository.create({
            userId,
            title: dto.title ? dto.title.trim() : generateDefaultEntryName(actor.settings?.lang),
            text,
            personIds,
            placeIds,
            voice,
            images
        });

        const basePayload = {
            pipeline: EntryPipelinesEnum.Create,
            userId,
            entryId: entry.id
        };

        await this.entryProcessingService.activatePipeline(
            EntryPipelinesEnum.Create,
            {
                hasCoords: hasLocationCoords,
                hasVoice: Boolean(voice),
                hasText: Boolean(text),
                hasImage: hasMedia
            },
            {
                ...(hasLocationCoords && {
                    [DelayedJob.EntryLocation]: {
                        ...basePayload,
                        locations: locationCoords,
                        userLang: actor.settings?.lang
                    }
                }),
                [DelayedJob.EntryStt]: basePayload,
                [DelayedJob.EntryVision]: {
                    ...basePayload,
                    userLang: actor.settings?.lang
                },
                [DelayedJob.EntryEmbedText]: basePayload,
                [DelayedJob.EntryEmbedTitle]: basePayload,
                [DelayedJob.EntryLocationAndPeopleDetect]: basePayload,
                [DelayedJob.EntryEmbedImage]: basePayload
            }
        );

        const entryImages = await this.mapImages(entry.images);
        const entryVoice = await this.mapVoice(entry.voice);

        return entryMapper.toCreateResponse({
            id: entry.id,
            places: {
                ready: dto.placeIds?.length ?? 0,
                processing: locations.length ?? 0
            },
            images: entryImages,
            voice: entryVoice
        });
    }

    async updateBase(actor: Actor, id: string, dto: BaseEntryUpdateDto): Promise<BaseEntryDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        const exist = await this.entryRepository.findOwnedById(id, userId);

        if (!exist) {
            throw apiError.notFound('entry.not_found');
        }

        if (dto.peoples || dto.places) {
            await this.checkLinkedEntities(userId, dto.peoples ?? [], dto.places ?? []);
        }

        if (dto.places && dto.places.length > appConstants.entry.maxPlacesPerEntry) {
            throw apiError.badRequest('entry.too_many_places', {
                max: appConstants.entry.maxPlacesPerEntry
            });
        }

        const entry = await this.entryRepository.updateBase(id, {
            title: dto.title?.trim() || undefined,
            personIds: dto.peoples || undefined,
            placeIds: dto.places || undefined
        });

        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const images = await this.mapImages(entry.images);

        return entryMapper.toBaseEntry(
            {
                id: entry.id,
                title: entry.title,
                text: entry.text,
                formattedText: entry.formattedText,
                formattedTextFormat: entry.formattedTextFormat,
                isHasVoice: Boolean(entry.voice),
                isReady: entry.isReady,
                peoples: entry.people.map((el) => el.person),
                places: entry.places.map((el) => el.place),
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt
            },
            images
        );
    }

    private async mapImages(images: Array<EntryImageSource & { file: { key: string } }>): Promise<EntryImageDto[]> {
        return Promise.all(
            images.map(async (image) => {
                const url = await this.s3Service.getSignedUrl({
                    key: image.file.key,
                    expiresIn: appConstants.entry.imageLifeTime
                });

                return entryMapper.toImage(image, url);
            })
        );
    }

    private async mapVoice(
        voice: (EntryVoiceSource & { file: { key: string } }) | null
    ): Promise<EntryVoiceDto | null> {
        if (!voice) {
            return null;
        }

        const url = await this.s3Service.getSignedUrl({
            key: voice.file.key,
            expiresIn: appConstants.entry.imageLifeTime
        });

        return entryMapper.toVoice(voice, url);
    }

    private async checkLinkedEntities(userId: string, personIds: string[], placeIds: string[]) {
        const [persons, places] = await Promise.all([
            this.entryRepository.findPersonsByUser(userId, personIds),
            this.entryRepository.findPlacesByUser(userId, placeIds)
        ]);

        if (persons.length !== personIds.length) {
            throw apiError.notFound('entry.person_not_found');
        }

        if (places.length !== placeIds.length) {
            throw apiError.notFound('entry.place_not_found');
        }
    }

    async softDelete(actor: Actor, id: string): Promise<void> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const deleted = await this.entryRepository.softDelete(id, actor.user.id);

        if (!deleted) {
            throw apiError.notFound('entry.not_found');
        }
    }

    async getById(actor: Actor, id: string): Promise<EntryDetailResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const entry = await this.entryRepository.findOwnedDetailById(id, actor.user.id);

        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const [photos, voice] = await Promise.all([this.mapImages(entry.images), this.mapVoice(entry.voice)]);

        return entryMapper.toDetail(entry, photos, voice);
    }

    async search(actor: Actor, dto: EntrySearchDto): Promise<EntrySearchResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        const queryText = dto.query?.trim();

        if (queryText) {
            const embedded = await this.embeddingService.embedText(queryText, 'query');

            const [entries, count] = await Promise.all([
                this.entrySearchRepository.searchByQuery(userId, dto, queryText, embedded.result),
                this.entrySearchRepository.countByQuery(userId, dto, queryText, embedded.result)
            ]);

            return {
                data: entries.map((entry) => entryMapper.toSearchItem(entry)),
                count
            };
        }

        const [entries, count] = await Promise.all([
            this.entryRepository.search(userId, dto),
            this.entryRepository.count(userId, dto)
        ]);

        return {
            data: entries.map((entry) => entryMapper.toSearchItem(entry)),
            count
        };
    }
}
