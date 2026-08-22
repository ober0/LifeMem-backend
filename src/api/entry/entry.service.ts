import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { FileType } from '@prisma/client';

import type { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { translations } from '../../common/translation/text-translations';
import { LangEnum } from '../../common/types/common/lang.enum';
import { S3Service } from '../s3/s3.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import { EntryRepository } from './entry.repository';
import type { ParsedLocation } from './helpers/parse-form-data.helper';
import type { CreateEntryFileInput, UploadedEntryFiles, UploadedFile } from './types/uploaded-file.type';

@Injectable()
export class EntryService {
    constructor(
        private readonly entryRepository: EntryRepository,
        private readonly s3Service: S3Service
    ) {}

    async create(
        actor: Actor,
        dto: CreateEntryDto,
        files: UploadedEntryFiles,
        location?: ParsedLocation
    ): Promise<CreateEntryResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const userId = actor.user.id;
        const voiceFile = files.voice?.[0];
        const photoFiles = files.photos ?? [];

        this.checkInput(dto.text, voiceFile);
        this.checkPhotosLimit(photoFiles);
        if (location) {
            this.checkGeo(location);
        }

        if (voiceFile && !voiceFile.mimetype.startsWith('audio/')) {
            throw apiError.badRequest('entry.invalid_voice_type');
        }

        for (const photo of photoFiles) {
            if (!photo.mimetype.startsWith('image/')) {
                throw apiError.badRequest('entry.invalid_photo_type');
            }
        }

        const personIds = dto.personIds ?? [];
        const placeIds = dto.placeIds ?? [];

        await this.checkLinkedEntities(userId, personIds, placeIds);

        const [voiceInput, imageInputs] = await Promise.all([
            voiceFile ? this.uploadVoice(userId, voiceFile) : Promise.resolve(undefined),
            Promise.all(photoFiles.map((photo) => this.uploadPhoto(userId, photo)))
        ]);

        const entry = await this.entryRepository.create({
            userId,
            title: dto.title ? dto.title.trim() : this.generateDefaultName(actor.settings?.lang),
            text: dto.text?.trim() || null,
            location,
            personIds,
            placeIds,
            voice: voiceInput,
            images: imageInputs
        });

        return {
            id: entry.id,
            status: entry.processing!.status
        };
    }

    private checkInput(text: string | undefined, voiceFile: UploadedFile | undefined): void {
        const hasText = Boolean(text?.trim());
        const hasVoice = Boolean(voiceFile);

        if (!hasText && !hasVoice) {
            throw apiError.badRequest('entry.text_or_voice_required');
        }

        if (hasText && hasVoice) {
            throw apiError.badRequest('entry.text_or_voice_only');
        }
    }

    private checkPhotosLimit(photoFiles: UploadedFile[]): void {
        if (photoFiles.length > appConstants.entry.maxPhotosPerEntry) {
            throw apiError.badRequest('entry.too_many_photos', {
                max: appConstants.entry.maxPhotosPerEntry
            });
        }
    }

    private checkGeo(location: ParsedLocation) {
        const hasLat = location.latitude !== undefined;
        const hasLng = location.longitude !== undefined;

        if (hasLat !== hasLng) {
            throw apiError.badRequest('entry.geo_incomplete');
        }
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
        const key = this.buildEntryFileKey(userId, FileType.AUDIO);

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

    private async uploadPhoto(userId: string, file: UploadedFile): Promise<CreateEntryFileInput> {
        const key = this.buildEntryFileKey(userId, FileType.IMAGE);

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
            type: FileType.IMAGE
        };
    }

    private buildEntryFileKey(userId: string, type: FileType): string {
        return `users/${userId}/entry-files/${String(type).toLowerCase()}/${randomUUID()}`;
    }

    private generateDefaultName(lang: LangEnum = appConstants.language.default) {
        const date = new Date();

        const formattedDate = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);

        return translations.byTextKey({
            key: 'entry.defaultName',
            lang,
            variables: {
                date: formattedDate
            }
        });
    }
}
