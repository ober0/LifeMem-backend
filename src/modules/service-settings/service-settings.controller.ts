import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuardHttp } from '../auth/guards/auth.guard';
import { ServiceSettingsDto } from './dto/base.dto';
import { ServiceSettingsService } from './service-settings.service';
import { ServiceSettingsUpdateDto } from './dto/update.dto';

@ApiTags('Service Settings')
@Controller('settings')
export class ServiceSettingsController {
    constructor(private readonly service: ServiceSettingsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить настройки приложения' })
    @ApiOkResponse({ type: ServiceSettingsDto })
    async getServiceSettings() {
        return this.service.getServiceSettings();
    }

    @Patch('set')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuardHttp())
    @ApiOperation({ summary: 'Частично обновить настройки приложения' })
    @ApiOkResponse({ type: ServiceSettingsDto })
    async updateServiceSettings(@Body() dto: ServiceSettingsUpdateDto) {
        return this.service.updateServiceSettings(dto);
    }
}
