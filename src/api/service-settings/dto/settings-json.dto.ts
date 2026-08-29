import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsNumber,
    Validate,
    ValidateIf,
    ValidateNested
} from 'class-validator';
import type { CountryCode } from 'libphonenumber-js';

import { phoneConstants } from '../../../common/config/constants/phone.constants';
import { IsCountryCodeArrayConstraint } from '../../../common/helpers/is-country-code-array.constraint';

export class AuthMethodDto {
    @ApiProperty()
    @IsBoolean()
    isRegistrationEnabled: boolean;

    @ApiProperty()
    @IsBoolean()
    isLoginEnabled: boolean;

    @ApiProperty()
    @IsBoolean()
    allowAllCountry: boolean;

    @ApiProperty({
        type: 'string',
        isArray: true,
        enum: phoneConstants.countryCodes,
        example: ['RU', 'KZ']
    })
    @ValidateIf((o: AuthMethodDto) => o.allowAllCountry === false)
    @IsArray()
    @ArrayNotEmpty()
    @Validate(IsCountryCodeArrayConstraint)
    countriesWhitelist: CountryCode[];
}

export class AuthMethodsSettings {
    @ApiProperty({ type: AuthMethodDto })
    @ValidateNested()
    @Type(() => AuthMethodDto)
    freshCall: AuthMethodDto;

    @ApiProperty({ type: AuthMethodDto })
    @ValidateNested()
    @Type(() => AuthMethodDto)
    google: AuthMethodDto;

    @ApiProperty({ type: AuthMethodDto })
    @ValidateNested()
    @Type(() => AuthMethodDto)
    apple: AuthMethodDto;

    @ApiProperty({ type: AuthMethodDto })
    @ValidateNested()
    @Type(() => AuthMethodDto)
    telegram: AuthMethodDto;

    @ApiProperty({ type: AuthMethodDto })
    @ValidateNested()
    @Type(() => AuthMethodDto)
    email: AuthMethodDto;
}

export type AuthMethodKey = keyof AuthMethodsSettings;

export class ServiceSettingsJsonDto {
    @ApiProperty()
    @IsNumber()
    appVersion: number;

    @ApiProperty({ type: AuthMethodsSettings })
    @ValidateNested()
    @Type(() => AuthMethodsSettings)
    authMethods: AuthMethodsSettings;
}
