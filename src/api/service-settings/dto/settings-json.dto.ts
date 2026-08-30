import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsUUID,
    Validate,
    ValidateIf,
    ValidateNested
} from 'class-validator';
import type { CountryCode } from 'libphonenumber-js';

import { phoneConstants } from '../../../common/config/constants/phone.constants';
import { IsCountryCodeArrayConstraint } from '../../../common/helpers/is-country-code-array.constraint';
import { AiProvider } from '../../../common/types/ai/ai-provider.enum';

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

export class ModelTierSettingsDto {
    @ApiProperty({ format: 'uuid', nullable: true, type: String })
    @ValidateIf((_, value) => value !== null)
    @IsUUID()
    premium: string | null;

    @ApiProperty({ format: 'uuid', nullable: true, type: String })
    @ValidateIf((_, value) => value !== null)
    @IsUUID()
    lite: string | null;
}

export class ModelsSettingsDto {
    @ApiProperty({ type: ModelTierSettingsDto })
    @ValidateNested()
    @Type(() => ModelTierSettingsDto)
    analyze: ModelTierSettingsDto;

    @ApiProperty({ type: ModelTierSettingsDto })
    @ValidateNested()
    @Type(() => ModelTierSettingsDto)
    embedding: ModelTierSettingsDto;

    @ApiProperty({ enum: AiProvider })
    @IsEnum(AiProvider)
    provider: AiProvider;
}

export class ServiceSettingsJsonDto {
    @ApiProperty()
    @IsNumber()
    appVersion: number;

    @ApiProperty({ type: AuthMethodsSettings })
    @ValidateNested()
    @Type(() => AuthMethodsSettings)
    authMethods: AuthMethodsSettings;

    @ApiProperty({ type: ModelsSettingsDto })
    @ValidateNested()
    @Type(() => ModelsSettingsDto)
    models: ModelsSettingsDto;
}
