import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Actor } from '../../common/actor';
import { UserSettingsDto } from '../../common/types/user';
import { CurrentActor } from '../auth/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../auth/guards/auth.guard';
import { UserSettingsService } from './user-settings.service';

@ApiTags('User settings')
@UseGuards(JwtAuthGuardHttp())
@Controller('user-settings')
export class UserSettingsController {
    constructor(private readonly service: UserSettingsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить настройки пользователя' })
    @ApiOkResponse({ type: UserSettingsDto })
    async get(@CurrentActor() actor: Actor): Promise<UserSettingsDto> {
        return this.service.get(actor.user!.id);
    }

    @Put()
    @ApiOperation({ summary: 'Обновить настройки пользователя' })
    @ApiOkResponse({ type: UserSettingsDto })
    async update(@Body() dto: UserSettingsDto, @CurrentActor() actor: Actor): Promise<UserSettingsDto> {
        return this.service.update(actor.user!.id, dto);
    }
}
