import type { CountryCode} from 'libphonenumber-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { PHONE_BLACKLIST, PHONE_DEFAULT_COUNTRY, PHONE_WHITELIST } from '../../config/phone.config';
import type { PhoneData } from './phone.type';

export class Phone {
    private readonly _data: PhoneData;
    private readonly _isAccess: boolean;

    private constructor(data: PhoneData) {
        this._data = data;
        this._isAccess = this.resolveAccess(data.country);
    }

    static tryCreate(phone: string): Phone | null {
        const input = phone.trim();
        const parsed = parsePhoneNumberFromString(input, PHONE_DEFAULT_COUNTRY);

        if (!parsed?.isValid() || !parsed.country) {
            return null;
        }

        return new Phone({
            normalized: parsed.number.replace(/^\+/, ''),
            country: parsed.country,
            dialCode: parsed.countryCallingCode
        });
    }

    get isAccess(): boolean {
        return this._isAccess;
    }

    get data(): PhoneData {
        return this._data;
    }

    get normalized(): string {
        return this._data.normalized;
    }

    private resolveAccess(country: CountryCode): boolean {
        if (PHONE_BLACKLIST?.includes(country)) {
            return false;
        }

        if (PHONE_WHITELIST && !PHONE_WHITELIST.includes(country)) {
            return false;
        }

        return true;
    }
}
