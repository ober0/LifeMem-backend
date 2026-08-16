import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogsSearchResponseDto } from './dto/base.dto';
import { LogsSearchDto } from './dto/search.dto';
import { LogsService } from './logs.service';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { Permission } from '../../common/config/role-permission';

@Controller('logs')
@ApiTags('Logs')
export class LogsController {
    constructor(private readonly service: LogsService) {}

    @Post('search')
    @ApiOperation({ summary: 'Поиск логов' })
    @ApiOkResponse({ type: LogsSearchResponseDto })
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.LogsRead] }))
    @HttpCode(200)
    async search(@Body() dto: LogsSearchDto): Promise<LogsSearchResponseDto> {
        return this.service.search(dto);
    }
}
