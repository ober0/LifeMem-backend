import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Actor } from '../../common/classes/actor';
import { Permission } from '../../common/config/role-permission';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { ServiceSettingsDto, ServiceSettingsResponseDto } from './dto/base.dto';
import { ServiceSettingsUpdateDto } from './dto/update.dto';
import { ServiceSettingsService } from './service-settings.service';

@ApiTags('Service Settings')
@Controller('settings')
export class ServiceSettingsController {
    constructor(private readonly service: ServiceSettingsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить настройки приложения' })
    @ApiOkResponse({ type: ServiceSettingsResponseDto })
    @ApiErrorResponses(404)
    async getServiceSettings(@CurrentActor() actor: Actor) {
        return this.service.getServiceSettings(actor);
    }

    @Patch('set')
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.ServiceSettingsUpdate] }))
    @ApiOperation({ summary: 'Частично обновить настройки приложения' })
    @ApiOkResponse({ type: ServiceSettingsDto })
    @ApiErrorResponses(400, 401, 403, 404)
    async updateServiceSettings(@Body() dto: ServiceSettingsUpdateDto) {
        return this.service.updateServiceSettings(dto);
    }
}
