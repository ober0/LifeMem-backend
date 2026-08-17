import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    GatewayTimeoutException,
    InternalServerErrorException,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException
} from '@nestjs/common';

export type ErrorVariables = Record<string, string | number>;

export const apiError = {
    badRequest: (code: string, variables?: ErrorVariables) =>
        new BadRequestException({
            code,
            ...(variables && { variables })
        }),

    unauthorized: (code: string, variables?: ErrorVariables) =>
        new UnauthorizedException({
            code,
            ...(variables && { variables })
        }),

    forbidden: (code: string, variables?: ErrorVariables) =>
        new ForbiddenException({
            code,
            ...(variables && { variables })
        }),

    notFound: (code: string, variables?: ErrorVariables) =>
        new NotFoundException({
            code,
            ...(variables && { variables })
        }),

    conflict: (code: string, variables?: ErrorVariables) =>
        new ConflictException({
            code,
            ...(variables && { variables })
        }),

    internal: (code: string, variables?: ErrorVariables) =>
        new InternalServerErrorException({
            code,
            ...(variables && { variables })
        }),

    serviceUnavailable: (code: string, variables?: ErrorVariables) =>
        new ServiceUnavailableException({
            code,
            ...(variables && { variables })
        }),

    gatewayTimeout: (code: string, variables?: ErrorVariables) =>
        new GatewayTimeoutException({
            code,
            ...(variables && { variables })
        })
};
