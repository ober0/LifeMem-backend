import { Injectable } from '@nestjs/common';
import { FileType } from '@prisma/client';

import type { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { EntryProcessingService } from '../entry-processing/entry-processing.service';
import { EntryPipelinesEnum } from '../entry-processing/pipelines';
import { S3Service } from '../s3/s3.service';
import type { BaseEntryDto, BaseEntryUpdateDto } from './dto/base';
import { CreateEntryDto } from './dto/create-entry.dto';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryImageDto } from './dto/entry-images';
import { EntryImageSource } from './dto/types';
import { entryMapper } from './entry.mapper';
import { EntryRepository } from './entry.repository';
import {
    buildEntryFileKey,
    checkEntryInput,
    checkGeo,
    checkPhotoDescriptions,
    checkPhotoMimeTypes,
    checkPhotosLimit,
    checkPlacesLimit,
    checkVoiceMimeType,
    generateDefaultEntryName,
    toLocationCoords
} from './helpers/entry.helper';
import type { ParsedLocation } from './helpers/parse-form-data.helper';
import type { CreateEntryFileInput, UploadedEntryFiles, UploadedFile } from './types/uploaded-file.type';

@Injectable()
export class EntryService {
    constructor(
        private readonly entryRepository: EntryRepository,
        private readonly s3Service: S3Service,
        private readonly entryProcessingService: EntryProcessingService
    ) {}

    private async validateCreateInput(
        dto: CreateEntryDto,
        voiceFile: UploadedFile | undefined,
        photoFiles: UploadedFile[],
        locations: ParsedLocation[]
    ) {
        checkEntryInput(dto.text, voiceFile);
        checkPhotosLimit(photoFiles);
        checkPhotoDescriptions(photoFiles, dto.photoDescriptions);

        for (const location of locations) {
            checkGeo(location);

            if (location.latitude === undefined || location.longitude === undefined) {
                throw apiError.badRequest('entry.geo_incomplete');
            }
        }

        checkPlacesLimit(dto.placeIds?.length ?? 0, locations.length);

        if (voiceFile) {
            checkVoiceMimeType(voiceFile);
        }

        checkPhotoMimeTypes(photoFiles);
    }

    async create(
        actor: Actor,
        dto: CreateEntryDto,
        files: UploadedEntryFiles,
        locations: ParsedLocation[] = []
    ): Promise<CreateEntryResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        const voiceFile = files.voice?.[0];
        const photoFiles = files.photos ?? [];

        await this.validateCreateInput(dto, voiceFile, photoFiles, locations);

        const personIds = dto.personIds ?? [];
        const placeIds = dto.placeIds ?? [];
        const locationCoords = toLocationCoords(locations);

        await this.checkLinkedEntities(userId, personIds, placeIds);

        const [voiceInput, imageInputs] = await Promise.all([
            voiceFile ? this.uploadVoice(userId, voiceFile) : Promise.resolve(undefined),
            Promise.all(
                photoFiles.map((photo, index) =>
                    this.uploadPhoto(userId, photo, dto.photoDescriptions?.[index] ?? null)
                )
            )
        ]);

        const text = dto.text?.trim() || null;
        const hasLocationCoords = locationCoords.length > 0;

        const entry = await this.entryRepository.create({
            userId,
            title: dto.title ? dto.title.trim() : generateDefaultEntryName(actor.settings?.lang),
            text,
            personIds,
            placeIds,
            voice: voiceInput,
            images: imageInputs
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
                hasVoice: Boolean(voiceFile),
                hasText: Boolean(text),
                hasImage: photoFiles.length > 0
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
                [DelayedJob.EntryVision]: basePayload,
                [DelayedJob.EntryEmbedText]: basePayload,
                [DelayedJob.EntryEmbedTitle]: basePayload,
                [DelayedJob.EntryLocationAndPeopleDetect]: basePayload,
                [DelayedJob.EntryEmbedImage]: basePayload
            }
        );

        const images = await this.mapImages(entry.images);

        return entryMapper.toCreateResponse(
            {
                id: entry.id,
                places: {
                    ready: dto.placeIds?.length ?? 0,
                    processing: locations.length ?? 0
                }
            },
            images
        );
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

        const images = await this.mapImages(entry.images);

        return entryMapper.toBaseEntry(
            {
                id: entry.id,
                title: entry.title,
                text: entry.text,
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

    private async uploadVoice(userId: string, file: UploadedFile): Promise<CreateEntryFileInput> {
        const key = buildEntryFileKey(userId, 'audio');

        await this.s3Service.upload({
            key,
            body: file.buffer,
            contentType: file.mimetype
        });

        return {
            key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: BigInt(file.size),
            type: FileType.AUDIO
        };
    }

    private async uploadPhoto(
        userId: string,
        file: UploadedFile,
        description: string | null
    ): Promise<CreateEntryFileInput> {
        const key = buildEntryFileKey(userId, 'image');

        await this.s3Service.upload({
            key,
            body: file.buffer,
            contentType: file.mimetype
        });

        return {
            key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: BigInt(file.size),
            type: FileType.IMAGE,
            description
        };
    }

    async getById(id: string) {
        const data = await this.entryRepository.getById(id);
        if (!data) {
            throw apiError.notFound('entry.not_found');
        }

        return data;
    }
}
