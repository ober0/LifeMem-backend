import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Actor } from '../../common/classes/actor';
import { UserSettingsDto } from '../../common/types/user';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { UserSettingsService } from './user-settings.service';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { UserSettingsUpdateDto } from './dto/user-settings.dto';

@ApiTags('User settings')
@UseGuards(JwtAuthGuardHttp({}))
@Controller('user-settings')
export class UserSettingsController {
    constructor(private readonly service: UserSettingsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить настройки пользователя' })
    @ApiOkResponse({ type: UserSettingsDto })
    @ApiErrorResponses(401)
    async get(@CurrentActor() actor: Actor): Promise<UserSettingsDto> {
        return this.service.get(actor.user!.id);
    }

    @Patch()
    @ApiOperation({ summary: 'Обновить настройки пользователя' })
    @ApiOkResponse({ type: UserSettingsDto })
    @ApiErrorResponses(401)
    async update(@Body() dto: UserSettingsUpdateDto, @CurrentActor() actor: Actor): Promise<UserSettingsDto> {
        return this.service.update(actor.user!.id, dto);
    }
}
