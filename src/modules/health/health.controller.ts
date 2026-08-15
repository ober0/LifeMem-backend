import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthServiceStatusDto } from './dto/health-status.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @ApiOperation({ summary: 'Проверка приложения и зависимостей' })
    @ApiOkResponse({ type: HealthServiceStatusDto, isArray: true })
    check(): Promise<HealthServiceStatusDto[]> {
        return this.healthService.check();
    }
}
