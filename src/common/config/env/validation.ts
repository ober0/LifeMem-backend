import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf, validateSync } from 'class-validator';

enum NodeEnv {
    Development = 'development',
    Production = 'production',
    Test = 'test'
}

class EnvironmentVariables {
    @IsOptional()
    @IsEnum(NodeEnv)
    NODE_ENV?: NodeEnv;

    @IsOptional()
    @IsInt()
    @Min(1)
    PORT?: number;

    @IsString()
    @IsNotEmpty()
    JWT_ACCESS_SECRET: string;

    @IsString()
    @IsNotEmpty()
    JWT_REFRESH_SECRET: string;

    @IsInt()
    @Min(1)
    SALT_ROUNDS: number;

    @IsString()
    @IsNotEmpty()
    S3_BUCKET: string;

    @IsString()
    @IsNotEmpty()
    S3_ENDPOINT: string;

    @IsString()
    @IsNotEmpty()
    S3_REGION: string;

    @IsString()
    @IsNotEmpty()
    S3_ACCESS_KEY_ID: string;

    @IsString()
    @IsNotEmpty()
    S3_SECRET_ACCESS_KEY: string;

    @IsOptional()
    @IsString()
    REDIS_URL?: string;

    @IsOptional()
    @IsString()
    SMTP_SERVICE_HOST?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    SMTP_PORT?: number;

    @IsOptional()
    @IsString()
    SMTP_USER?: string;

    @IsOptional()
    @IsString()
    SMTP_PASS?: string;

    @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV === NodeEnv.Production)
    @IsString()
    @IsNotEmpty()
    SWAGGER_USER?: string;

    @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV === NodeEnv.Production)
    @IsString()
    @IsNotEmpty()
    SWAGGER_PASS?: string;

    @IsOptional()
    @IsString()
    GOOGLE_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    APPLE_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    TELEGRAM_BOT_TOKEN?: string;

    @IsOptional()
    @IsString()
    TELEGRAM_BOT_USERNAME?: string;
}

export function validateEnv(config: Record<string, unknown>) {
    const validated = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true
    });

    const errors = validateSync(validated, {
        skipMissingProperties: false
    });

    if (errors.length > 0 && validated.NODE_ENV !== NodeEnv.Test) {
        throw new Error(errors.toString());
    }

    return validated;
}
