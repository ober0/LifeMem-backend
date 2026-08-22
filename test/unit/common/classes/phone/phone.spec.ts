import { Phone } from '../../../../../src/common/classes/phone/phone';

describe('Phone', () => {
    it('parses valid RU number', () => {
        const phone = Phone.tryCreate('+79991234567');

        expect(phone).not.toBeNull();
        expect(phone!.normalized).toBe('79991234567');
        expect(phone!.data.country).toBe('RU');
        expect(phone!.isAccess).toBe(true);
    });

    it('parses local RU format with default country', () => {
        const phone = Phone.tryCreate('89991234567');

        expect(phone).not.toBeNull();
        expect(phone!.normalized).toBe('79991234567');
    });

    it('returns null for invalid number', () => {
        expect(Phone.tryCreate('888881221')).toBeNull();
        expect(Phone.tryCreate('test')).toBeNull();
    });
});
