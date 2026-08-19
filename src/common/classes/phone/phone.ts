import type { CountryCode} from 'libphonenumber-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { appConstants } from '../../config/app.constants';
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
        const parsed = parsePhoneNumberFromString(input, appConstants.phone.defaultCountry);

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
        if (appConstants.phone.blacklist?.includes(country)) {
            return false;
        }

        if (appConstants.phone.whitelist && !appConstants.phone.whitelist.includes(country)) {
            return false;
        }

        return true;
    }
}
