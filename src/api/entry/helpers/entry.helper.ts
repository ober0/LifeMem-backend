import { EntryProcessingStatus } from '@prisma/client';

import { appConstants } from '../../../common/config/app.constants';
import { apiError } from '../../../common/helpers/errors';
import { translations } from '../../../common/translation/text-translations';
import { LangEnum } from '../../../common/types/common/lang.enum';
import type { EntryLocationDto } from '../dto/create-entry.dto';

export function calcEntryProcessingStatus(jobs: Array<{ status: EntryProcessingStatus }>) {
    const activeJobs = jobs.filter((job) => job.status !== EntryProcessingStatus.Cancelled);

    return {
        done: activeJobs.filter((job) => job.status === EntryProcessingStatus.Done).length,
        total: activeJobs.length,
        error: activeJobs.filter((job) => job.status === EntryProcessingStatus.Failed).length
    };
}

export function checkEntryInput(text: string | undefined, audioId: string | undefined): void {
    const hasText = Boolean(text?.trim());
    const hasVoice = Boolean(audioId);

    if (!hasText && !hasVoice) {
        throw apiError.badRequest('entry.text_or_voice_required');
    }

    if (hasText && hasVoice) {
        throw apiError.badRequest('entry.text_or_voice_only');
    }
}

export function checkMediaLimit(mediaCount: number): void {
    if (mediaCount > appConstants.entry.maxPhotosPerEntry) {
        throw apiError.badRequest('entry.too_many_photos', {
            max: appConstants.entry.maxPhotosPerEntry
        });
    }
}

export function checkGeo(location: EntryLocationDto): void {
    const hasLat = location.latitude !== undefined;
    const hasLng = location.longitude !== undefined;

    if (hasLat !== hasLng) {
        throw apiError.badRequest('entry.geo_incomplete');
    }
}

export function checkPlacesLimit(placeIdsCount: number, locationsCount: number): void {
    if (placeIdsCount + locationsCount > appConstants.entry.maxPlacesPerEntry) {
        throw apiError.badRequest('entry.too_many_places', {
            max: appConstants.entry.maxPlacesPerEntry
        });
    }
}

export function toLocationCoords(
    locations: EntryLocationDto[]
): Array<{ latitude: number; longitude: number; locationLabel?: string }> {
    return locations
        .filter(
            (location): location is EntryLocationDto & { latitude: number; longitude: number } =>
                location.latitude !== undefined && location.longitude !== undefined
        )
        .map((location) => ({
            latitude: location.latitude,
            longitude: location.longitude,
            ...(location.locationLabel && { locationLabel: location.locationLabel.trim() })
        }));
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

export function normalizeMediaDescription(description: string | null | undefined): string | null {
    if (description == null) {
        return null;
    }

    const trimmed = description.trim();

    return trimmed === '' ? null : trimmed;
}
