import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    GatewayTimeoutException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException
} from '@nestjs/common';

import type { ErrorsTranslationKey } from '../../translations/generated';

export type ErrorVariables = Record<string, string | number>;

export const apiError = {
    badRequest: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new BadRequestException({
            code,
            ...(variables && { variables })
        }),

    unauthorized: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new UnauthorizedException({
            code,
            ...(variables && { variables })
        }),

    forbidden: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new ForbiddenException({
            code,
            ...(variables && { variables })
        }),

    notFound: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new NotFoundException({
            code,
            ...(variables && { variables })
        }),

    conflict: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new ConflictException({
            code,
            ...(variables && { variables })
        }),

    tooManyRequests: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new HttpException(
            {
                code,
                ...(variables && { variables })
            },
            HttpStatus.TOO_MANY_REQUESTS
        ),

    internal: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new InternalServerErrorException({
            code,
            ...(variables && { variables })
        }),

    serviceUnavailable: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new ServiceUnavailableException({
            code,
            ...(variables && { variables })
        }),

    gatewayTimeout: (code: ErrorsTranslationKey, variables?: ErrorVariables) =>
        new GatewayTimeoutException({
            code,
            ...(variables && { variables })
        })
};
