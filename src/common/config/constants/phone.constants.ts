import type { CountryCode } from 'libphonenumber-js';

const WHITELIST_COUNTRIES: CountryCode[] = [];
const BLACKLIST_COUNTRIES: CountryCode[] = [];

export const phoneConstants = {
    defaultCountry: 'RU' as CountryCode,
    whitelist: WHITELIST_COUNTRIES,
    blacklist: BLACKLIST_COUNTRIES
} as const;
