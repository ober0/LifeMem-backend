import { ApiProperty, OmitType } from '@nestjs/swagger';
import { OAuthProvider } from '@prisma/client';
import { BaseEntity } from '../../../common/types/common-entity.dto';

export class OAuthBindingDto extends OmitType(BaseEntity, ['id']) {
    @ApiProperty({ enum: OAuthProvider })
    provider: OAuthProvider;

    @ApiProperty()
    providerUserId: string;

    @ApiProperty({ required: false, type: 'string' })
    providerEmail: string | null;

    @ApiProperty({ required: false, type: 'string' })
    providerUsername: string | null;

    @ApiProperty({ required: false, type: 'string' })
    providerAvatarUrl: string | null;
}
