import { ApiProperty } from '@nestjs/swagger';

export class AlertBaseDto {
    @ApiProperty()
    message: string;

    @ApiProperty({ example: true })
    alert: boolean;
}
