import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { ServerSettings } from '../../common/classes/server-settings';
import { Permission } from '../../common/config/role-permission';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { CurrentServerSettings } from '../service-settings/decorators/current-server-settings.decorator';
import { AiModelService } from './ai-model.service';
import { AiModelDto, AiModelSearchResponseDto } from './dto/base.dto';
import { AiModelSearchDto } from './dto/search.dto';
import { AiModelUpdateDto } from './dto/update.dto';

@ApiTags('Admin/AiModel')
@Controller('admin/ai-model')
export class AiModelController {
    constructor(private readonly service: AiModelService) {}

    @Post('search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Список моделей' })
    @ApiOkResponse({ type: AiModelSearchResponseDto })
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.AiModelsRead] }))
    @ApiErrorResponses(400, 401, 403)
    async search(@Body() dto: AiModelSearchDto): Promise<AiModelSearchResponseDto> {
        return this.service.search(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Активация / деактивация модели' })
    @ApiOkResponse({ type: AiModelDto })
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.AiModelsUpdate] }))
    @ApiErrorResponses(400, 401, 403, 404, 409)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AiModelUpdateDto,
        @CurrentServerSettings() serverSettings: ServerSettings
    ): Promise<AiModelDto> {
        return this.service.update(id, dto, serverSettings);
    }
}
