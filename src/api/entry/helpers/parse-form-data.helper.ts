import { apiError } from '../../../common/helpers/errors';

function isEmptyFormValue(value: unknown): boolean {
    return value === undefined || value === null || value === '';
}

export function parseFormDataJson<T>(value: unknown): T | undefined {
    if (isEmptyFormValue(value)) {
        return undefined;
    }

    if (typeof value === 'object') {
        return value as T;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return undefined;
    }
}

export function parseFormDataUuidArray(value: unknown): string[] | undefined {
    if (isEmptyFormValue(value)) {
        return undefined;
    }

    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    try {
        const parsed: unknown = JSON.parse(value);

        if (Array.isArray(parsed)) {
            return parsed.map(String);
        }
    } catch {
        return [value];
    }

    return [value];
}

function normalizePhotoDescription(value: unknown): string | null {
    if (value === null) {
        return null;
    }

    if (typeof value !== 'string') {
        throw apiError.badRequest('entry.invalid_photo_descriptions');
    }

    const trimmed = value.trim();

    return trimmed === '' ? null : trimmed;
}

function parsePhotoDescriptionsArray(items: unknown[]): (string | null)[] {
    return items.map(normalizePhotoDescription);
}

export function parseFormDataPhotoDescriptions(value: unknown): (string | null)[] | undefined {
    if (isEmptyFormValue(value)) {
        return undefined;
    }

    if (Array.isArray(value)) {
        return parsePhotoDescriptionsArray(value);
    }

    if (typeof value !== 'string') {
        throw apiError.badRequest('entry.invalid_photo_descriptions');
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(value);
    } catch {
        throw apiError.badRequest('entry.invalid_photo_descriptions');
    }

    if (!Array.isArray(parsed)) {
        throw apiError.badRequest('entry.invalid_photo_descriptions');
    }

    return parsePhotoDescriptionsArray(parsed);
}

type LocationFormPayload = {
    latitude?: unknown;
    longitude?: unknown;
    locationLabel?: unknown;
};

function parseCoordinate(value: unknown): number | undefined {
    if (isEmptyFormValue(value)) {
        return undefined;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
}

export type ParsedLocation = {
    latitude?: number;
    longitude?: number;
    locationLabel?: string;
};

export function parseLocation(locationValue: unknown): ParsedLocation | undefined {
    const payload = parseFormDataJson<LocationFormPayload>(locationValue);

    if (!payload) {
        return undefined;
    }

    const latitude = parseCoordinate(payload.latitude);
    const longitude = parseCoordinate(payload.longitude);
    const locationLabelRaw = payload.locationLabel;
    const locationLabel =
        typeof locationLabelRaw === 'string' && locationLabelRaw.trim() !== '' ? locationLabelRaw.trim() : undefined;

    if (latitude === undefined && longitude === undefined && locationLabel === undefined) {
        return undefined;
    }

    return {
        latitude,
        longitude,
        locationLabel
    };
}
