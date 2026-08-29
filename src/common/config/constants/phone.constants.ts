import type { CountryCode } from 'libphonenumber-js';
import { getCountries } from 'libphonenumber-js';

const WHITELIST_COUNTRIES: CountryCode[] = [];
const BLACKLIST_COUNTRIES: CountryCode[] = [];
const COUNTRY_CODES = getCountries();

export const phoneConstants = {
    defaultCountry: 'RU' as CountryCode,
    whitelist: WHITELIST_COUNTRIES,
    blacklist: BLACKLIST_COUNTRIES,
    countryCodes: COUNTRY_CODES
} as const;
