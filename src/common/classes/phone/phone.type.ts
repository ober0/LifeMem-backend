import type { CountryCode } from 'libphonenumber-js';

export type PhoneData = {
    /** Единый формат без +, например 79261483460 */
    normalized: string;
    /** ISO код страны, например RU */
    country: CountryCode;
    /** Телефонный код страны (начальные цифры), например 7 */
    dialCode: string;
};
