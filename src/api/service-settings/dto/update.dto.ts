import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, Validate, ValidateNested } from 'class-validator';
import type { CountryCode } from 'libphonenumber-js';

import { phoneConstants } from '../../../common/config/constants/phone.constants';
import { IsCountryCodeArrayConstraint } from '../../../common/helpers/is-country-code-array.constraint';

export class AuthMethodUpdateDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isRegistrationEnabled?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isLoginEnabled?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    allowAllCountry?: boolean;

    @ApiPropertyOptional({
        type: 'string',
        isArray: true,
        enum: phoneConstants.countryCodes,
        example: ['RU', 'KZ']
    })
    @IsOptional()
    @IsArray()
    @Validate(IsCountryCodeArrayConstraint)
    countriesWhitelist?: CountryCode[];
}

export class AuthMethodsSettingsUpdateDto {
    @ApiPropertyOptional({ type: AuthMethodUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthMethodUpdateDto)
    freshCall?: AuthMethodUpdateDto;

    @ApiPropertyOptional({ type: AuthMethodUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthMethodUpdateDto)
    google?: AuthMethodUpdateDto;

    @ApiPropertyOptional({ type: AuthMethodUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthMethodUpdateDto)
    apple?: AuthMethodUpdateDto;

    @ApiPropertyOptional({ type: AuthMethodUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthMethodUpdateDto)
    telegram?: AuthMethodUpdateDto;

    @ApiPropertyOptional({ type: AuthMethodUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthMethodUpdateDto)
    email?: AuthMethodUpdateDto;
}

export class ServiceSettingsUpdateDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    appVersion?: number;

    @ApiPropertyOptional({ type: AuthMethodsSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthMethodsSettingsUpdateDto)
    authMethods?: AuthMethodsSettingsUpdateDto;
}
