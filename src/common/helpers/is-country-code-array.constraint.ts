import type { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

import { phoneConstants } from '../config/constants/phone.constants';

const COUNTRY_CODE_SET = new Set<string>(phoneConstants.countryCodes);

@ValidatorConstraint({ name: 'IsCountryCodeArray', async: false })
export class IsCountryCodeArrayConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.every((item) => typeof item === 'string' && COUNTRY_CODE_SET.has(item));
    }

    defaultMessage(args: ValidationArguments): string {
        return `${args.property} must be an array of valid ISO country codes`;
    }
}
