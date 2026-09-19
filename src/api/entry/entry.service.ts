import { Injectable } from '@nestjs/common';
import { EntryProcessingType } from '@prisma/client';

import type { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { mapPagination } from '../../common/helpers/map.pagination';
import { EntryPipelinesEnum } from '../../common/pipelines';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { EmbeddingService } from '../embedding/embedding.service';
import { EntryProcessingService } from '../entry-processing/entry-processing.service';
import { FilesRepository } from '../files/files.repository';
import { S3Service } from '../s3/s3.service';
import type { AttachEntryMediaDto } from './dto/attach-entry-media.dto';
import type { BaseEntryDto, BaseEntryUpdateDto } from './dto/base';
import { CreateEntryDto } from './dto/create-entry.dto';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryMediaDto } from './dto/entry-media.dto';
import { EntryVoiceDto } from './dto/entry-voices';
import type { EntryDetailResponseDto } from './dto/get-entry-response.dto';
import type { EntrySearchDto } from './dto/search/search-request.dto';
import type { EntrySearchResponseDto } from './dto/search/search-response.dto';
import { EntryMediaSource, EntryVoiceSource } from './dto/types';
import { entryMapper } from './entry.mapper';
import { EntryRepository } from './entry.repository';
import { EntrySearchRepository } from './entry-search.repository';
import {
    assertEntryAudioFileType,
    assertEntryMediaFiles,
    assertEntryMediaFileType,
    checkEntryInput,
    checkGeo,
    checkMediaLimit,
    checkPlacesLimit,
    generateDefaultEntryName,
    normalizeMediaDescription,
    toLocationCoords
} from './helpers/entry.helper';
import type { CreateEntryMediaInput, CreateEntryVoiceInput } from './types/uploaded-file.type';

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
    ): Promise<{ media: CreateEntryMediaInput[]; voice?: CreateEntryVoiceInput }> {
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

        assertEntryMediaFiles(fileById, mediaIds);

        if (dto.audioId) {
            assertEntryAudioFileType(fileById.get(dto.audioId)!.type);
        }

        return {
            media: media.map((item) => ({
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

        const { media, voice } = await this.resolveEntryFiles(userId, dto);

        const text = dto.text?.trim() || null;
        const hasLocationCoords = locationCoords.length > 0;
        const hasMedia = media.length > 0;

        const entry = await this.entryRepository.create({
            userId,
            title: dto.title ? dto.title.trim() : generateDefaultEntryName(actor.settings?.lang),
            text,
            personIds,
            placeIds,
            voice,
            media
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
                hasMedia
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

        const entryMedia = await this.mapMedia(entry.media);
        const entryVoice = await this.mapVoice(entry.voice);

        return entryMapper.toCreateResponse({
            id: entry.id,
            places: {
                ready: dto.placeIds?.length ?? 0,
                processing: locations.length ?? 0
            },
            media: entryMedia,
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

        // if (exist.isReady) {
        //     throw apiError.badRequest('entry.edit_only_while_processing');
        // }

        if (dto.peoples || dto.places) {
            await this.checkLinkedEntities(userId, dto.peoples ?? [], dto.places ?? []);
        }

        const locations = dto.location ?? [];

        for (const location of locations) {
            checkGeo(location);

            if (!location.latitude || !location.longitude) {
                throw apiError.badRequest('entry.geo_incomplete');
            }
        }

        if (dto.places || locations.length > 0) {
            const placeIdsCount = dto.places ? dto.places.length : exist._count.places;
            checkPlacesLimit(placeIdsCount, locations.length);
        }

        const locationCoords = toLocationCoords(locations);

        const nextTitle = dto.title ? dto.title.trim() : undefined;
        const titleChanged = nextTitle && nextTitle !== exist.title && nextTitle.length > 0;

        const entry = await this.entryRepository.updateBase(id, {
            title: titleChanged ? nextTitle : undefined,
            personIds: dto.peoples || undefined,
            placeIds: dto.places || undefined
        });

        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const hasLocationCoords = locationCoords.length > 0;

        if (titleChanged || hasLocationCoords) {
            if (titleChanged) {
                await this.entryProcessingService.cancelActiveJob(id, EntryProcessingType.EmbedTitle);
            }

            if (hasLocationCoords) {
                await this.entryProcessingService.cancelActiveJob(id, EntryProcessingType.LocationConnect);
            }

            const basePayload = {
                pipeline: EntryPipelinesEnum.UpdateBase,
                userId,
                entryId: id
            };

            await this.entryProcessingService.activatePipeline(
                EntryPipelinesEnum.UpdateBase,
                {
                    hasCoords: hasLocationCoords,
                    hasVoice: false,
                    hasText: false,
                    hasMedia: false
                },
                {
                    ...(titleChanged && {
                        [DelayedJob.EntryEmbedTitle]: basePayload
                    }),
                    ...(hasLocationCoords && {
                        [DelayedJob.EntryLocation]: {
                            ...basePayload,
                            locations: locationCoords,
                            userLang: actor.settings?.lang
                        }
                    })
                }
            );
        }

        const mediaItems = await this.mapMedia(entry.media);

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
            mediaItems
        );
    }

    private async mapMedia(
        rows: Array<EntryMediaSource & { file: { key: string } }>
    ): Promise<EntryMediaDto[]> {
        return Promise.all(
            rows.map(async (row) => {
                const url = await this.s3Service.getSignedUrl({
                    key: row.file.key,
                    expiresIn: appConstants.entry.mediaUrlLifeTime
                });

                return entryMapper.toMedia(row, url);
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
            expiresIn: appConstants.entry.mediaUrlLifeTime
        });

        return entryMapper.toVoice(voice, url);
    }

    async attachMedia(actor: Actor, entryId: string, dto: AttachEntryMediaDto): Promise<EntryMediaDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        const entry = await this.entryRepository.findOwnedForMediaAttach(entryId, userId);

        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        if (!entry.isReady) {
            throw apiError.badRequest('entry.attach_only_when_ready');
        }

        const remaining = appConstants.entry.maxMediaPerEntry - entry._count.media;
        if (remaining < 1) {
            throw apiError.badRequest('entry.too_many_media', {
                max: appConstants.entry.maxMediaPerEntry
            });
        }

        const fileExist = await this.entryRepository.existsEntryMediaByFileId(entryId, dto.fileId);
        if (fileExist) {
            throw apiError.badRequest('entry.file_already_attached');
        }

        const file = await this.resolveAttachableMediaFile(userId, dto.fileId);

        const mediaRow = await this.entryRepository.createEntryMedia(
            entryId,
            file.id,
            normalizeMediaDescription(dto.description)
        );

        const basePayload = {
            pipeline: EntryPipelinesEnum.UpdateMedia,
            userId,
            entryId
        };

        const entryMediaIds = [mediaRow.id];

        await this.entryProcessingService.activatePipeline(
            EntryPipelinesEnum.UpdateMedia,
            {
                hasCoords: false,
                hasVoice: false,
                hasText: false,
                hasMedia: true
            },
            {
                [DelayedJob.EntryVision]: {
                    ...basePayload,
                    entryMediaIds,
                    userLang: actor.settings?.lang
                }
            }
        );

        const [mapped] = await this.mapMedia([mediaRow]);
        return mapped;
    }

    async detachMedia(actor: Actor, entryId: string, mediaId: string): Promise<void> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const deleted = await this.entryRepository.deleteOwnedEntryMedia(entryId, mediaId, actor.user.id);

        if (!deleted) {
            throw apiError.notFound('entry.media_not_found');
        }
    }

    private async resolveAttachableMediaFile(userId: string, fileId: string) {
        const files = await this.filesRepository.findAttachableFilesByIds(userId, [fileId]);

        if (files.length !== 1) {
            throw apiError.notFound('entry.file_not_found');
        }

        const file = files[0]!;
        assertEntryMediaFileType(file.type);

        return file;
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

        const [mediaItems, voice] = await Promise.all([
            this.mapMedia(entry.media),
            this.mapVoice(entry.voice)
        ]);

        return entryMapper.toDetail(entry, mediaItems, voice);
    }

    async search(actor: Actor, dto: EntrySearchDto): Promise<EntrySearchResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        const queryText = dto.query?.trim();

        if (queryText) {
            let scopedEntryIds: string[] = [];

            if (this.entryRepository.hasActiveSearchFilters(dto.filters)) {
                const candidates = await this.entryRepository.findSearchFilterCandidates(userId, dto);
                const hasMedia = dto.filters?.hasMedia;
                scopedEntryIds = candidates
                    .filter((row) => {
                        if (hasMedia === undefined) {
                            return true;
                        }

                        return hasMedia ? row._count.media > 0 : row._count.media === 0;
                    })
                    .map((row) => row.id);

                if (scopedEntryIds.length === 0) {
                    return { data: [], count: 0 };
                }
            }

            const embedded = await this.embeddingService.embedText(queryText, 'query');

            const [entries, count] = await Promise.all([
                this.entrySearchRepository.searchByQuery(userId, dto, queryText, embedded.result, scopedEntryIds),
                this.entrySearchRepository.countByQuery(userId, dto, queryText, embedded.result, scopedEntryIds)
            ]);

            return {
                data: entries.map((entry) => entryMapper.toSearchItem(entry)),
                count
            };
        }

        if (dto.filters?.hasMedia !== undefined) {
            const all = await this.entryRepository.searchAll(userId, dto);
            const hasMedia = dto.filters.hasMedia;
            const filtered = all.filter((entry) => (hasMedia ? entry._count.media > 0 : entry._count.media === 0));
            const { take, skip } = mapPagination(dto.pagination);
            const page = filtered.slice(skip, skip + take);

            return {
                data: page.map((entry) => entryMapper.toSearchItem(entry)),
                count: filtered.length
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
