import type { Request } from 'express';
import type { CountryCode } from 'libphonenumber-js';
import { getCountries } from 'libphonenumber-js';

const COUNTRY_CODES = new Set<string>(getCountries());

const isCountryCode = (value: string): value is CountryCode => COUNTRY_CODES.has(value);

const parseCountryFromAcceptLanguage = (header: string): CountryCode | null => {
    for (const part of header.split(',')) {
        const locale = part.trim().split(';')[0];
        const segments = locale.split('-');

        if (segments.length < 2) {
            continue;
        }

        const region = segments.at(-1)?.toUpperCase();

        if (region && region.length === 2 && isCountryCode(region)) {
            return region;
        }
    }

    return null;
};

export const getCountryFromRequest = (request: Request): CountryCode | null => {
    const acceptLanguage = request.headers['accept-language'];

    if (typeof acceptLanguage !== 'string') {
        return null;
    }

    return parseCountryFromAcceptLanguage(acceptLanguage);
};

export const resolveAuthCountry = (
    phoneCountry?: CountryCode | null,
    requestCountry?: CountryCode | null
): CountryCode | null => phoneCountry ?? requestCountry ?? null;
