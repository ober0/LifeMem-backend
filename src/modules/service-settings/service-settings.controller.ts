import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Permission } from '../../common/config/role-permission';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { ServiceSettingsDto } from './dto/base.dto';
import type { ServiceSettingsUpdateDto } from './dto/update.dto';
import type { ServiceSettingsService } from './service-settings.service';

@ApiTags('Service Settings')
@Controller('settings')
export class ServiceSettingsController {
    constructor(private readonly service: ServiceSettingsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить настройки приложения' })
    @ApiOkResponse({ type: ServiceSettingsDto })
    @ApiErrorResponses(404)
    async getServiceSettings() {
        return this.service.getServiceSettings();
    }

    @Patch('set')
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.ServiceSettingsUpdate] }))
    @ApiOperation({ summary: 'Частично обновить настройки приложения' })
    @ApiOkResponse({ type: ServiceSettingsDto })
    @ApiErrorResponses(401, 403)
    async updateServiceSettings(@Body() dto: ServiceSettingsUpdateDto) {
        return this.service.updateServiceSettings(dto);
    }
}
