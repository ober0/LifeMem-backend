import { randomUUID } from 'node:crypto';

import { appConstants } from '../../../common/config/app.constants';
import { apiError } from '../../../common/helpers/errors';
import { translations } from '../../../common/translation/text-translations';
import { LangEnum } from '../../../common/types/common/lang.enum';
import type { UploadedFile } from '../types/uploaded-file.type';
import type { ParsedLocation } from './parse-form-data.helper';

export function checkEntryInput(text: string | undefined, voiceFile: UploadedFile | undefined): void {
    const hasText = Boolean(text?.trim());
    const hasVoice = Boolean(voiceFile);

    if (!hasText && !hasVoice) {
        throw apiError.badRequest('entry.text_or_voice_required');
    }

    if (hasText && hasVoice) {
        throw apiError.badRequest('entry.text_or_voice_only');
    }
}

export function checkPhotosLimit(photoFiles: UploadedFile[]): void {
    if (photoFiles.length > appConstants.entry.maxPhotosPerEntry) {
        throw apiError.badRequest('entry.too_many_photos', {
            max: appConstants.entry.maxPhotosPerEntry
        });
    }
}

export function checkPhotoDescriptions(
    photoFiles: UploadedFile[],
    photoDescriptions: (string | null)[] | undefined
): void {
    if (!photoDescriptions || photoDescriptions.length === 0) {
        return;
    }

    if (photoDescriptions.length !== photoFiles.length) {
        throw apiError.badRequest('entry.photo_descriptions_mismatch');
    }
}

export function checkGeo(location: ParsedLocation): void {
    const hasLat = location.latitude !== undefined;
    const hasLng = location.longitude !== undefined;

    if (hasLat !== hasLng) {
        throw apiError.badRequest('entry.geo_incomplete');
    }
}

export function checkVoiceMimeType(file: UploadedFile): void {
    if (!file.mimetype.startsWith('audio/')) {
        throw apiError.badRequest('entry.invalid_voice_type');
    }
}

export function checkPhotoMimeTypes(photoFiles: UploadedFile[]): void {
    for (const photo of photoFiles) {
        if (!photo.mimetype.startsWith('image/')) {
            throw apiError.badRequest('entry.invalid_photo_type');
        }
    }
}

export function buildEntryFileKey(userId: string, type: 'audio' | 'image'): string {
    return `users/${userId}/entry-files/${type}/${randomUUID()}`;
}

export function generateDefaultEntryName(lang: LangEnum = appConstants.language.default): string {
    const formattedDate = new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date());

    return translations.byTextKey({
        key: 'entry.defaultName',
        lang,
        variables: {
            date: formattedDate
        }
    });
}

export function toNumberOrNull(value: unknown): number | null {
    if (value == null) {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}
