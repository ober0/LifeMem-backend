import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsUUID, Validate, ValidateIf, ValidateNested } from 'class-validator';
import type { CountryCode } from 'libphonenumber-js';

import { phoneConstants } from '../../../common/config/constants/phone.constants';
import { IsCountryCodeArrayConstraint } from '../../../common/helpers/is-country-code-array.constraint';
import { AiProvider } from '../../../common/types/ai/ai-provider.enum';

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

export class ModelTierSettingsUpdateDto {
    @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsUUID()
    premium?: string | null;

    @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsUUID()
    lite?: string | null;
}

export class ModelsSettingsUpdateDto {
    @ApiPropertyOptional({ type: ModelTierSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelTierSettingsUpdateDto)
    analyze?: ModelTierSettingsUpdateDto;

    @ApiPropertyOptional({ type: ModelTierSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelTierSettingsUpdateDto)
    embedding?: ModelTierSettingsUpdateDto;

    @ApiPropertyOptional({ type: ModelTierSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelTierSettingsUpdateDto)
    vision?: ModelTierSettingsUpdateDto;

    @ApiPropertyOptional({ type: ModelTierSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelTierSettingsUpdateDto)
    stt?: ModelTierSettingsUpdateDto;

    @ApiPropertyOptional({ type: ModelTierSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelTierSettingsUpdateDto)
    sttRefine?: ModelTierSettingsUpdateDto;

    @ApiPropertyOptional({ enum: AiProvider })
    @IsOptional()
    @IsEnum(AiProvider)
    provider?: AiProvider;
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

    @ApiPropertyOptional({ type: ModelsSettingsUpdateDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelsSettingsUpdateDto)
    models?: ModelsSettingsUpdateDto;
}
