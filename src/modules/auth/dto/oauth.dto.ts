import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class OAuthTokenDto {
    @ApiProperty()
    @IsString()
    idToken: string;
}
