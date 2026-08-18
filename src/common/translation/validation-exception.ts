import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function flattenValidationErrors(errors: ValidationError[], parentPath = '') {
    return errors.flatMap((error) => {
        const field = parentPath ? `${parentPath}.${error.property}` : error.property;

        const currentErrors = Object.keys(error.constraints ?? {}).map((constraint) => ({
            field,
            code: `validation.${constraint}`,
            base: error.constraints?.[constraint] ?? 'Validation error'
        }));

        const childErrors = flattenValidationErrors(error.children ?? [], field);

        return [...currentErrors, ...childErrors];
    });
}

export class ValidationException extends BadRequestException {
    constructor(errors: ValidationError[]) {
        super({
            errors: flattenValidationErrors(errors)
        });
    }
}
