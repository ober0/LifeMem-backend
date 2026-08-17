import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Actor } from '../../common/classes/actor';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { AuthLogSearchResponseDto } from './dto/base.dto';
import { AuthLogSearchDto } from './dto/search.dto';
import { AuthLogService } from './auth-log.service';

@ApiTags('Auth logs')
@ApiBearerAuth()
@Controller('auth-log')
export class AuthLogController {
    constructor(private readonly service: AuthLogService) {}

    @Post('search')
    @HttpCode(200)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Поиск логов авторизации' })
    @ApiOkResponse({ type: AuthLogSearchResponseDto })
    @ApiErrorResponses(400, 401, 403)
    async search(@Body() dto: AuthLogSearchDto, @CurrentActor() actor: Actor): Promise<AuthLogSearchResponseDto> {
        return this.service.search(dto, actor);
    }
}
