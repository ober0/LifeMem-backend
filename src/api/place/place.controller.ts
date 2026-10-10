import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { PlaceListResponseDto } from './dto/place.dto';
import { PlaceListQueryDto } from './dto/place-list-query.dto';
import { PlaceMapFiltersDto, PlaceMapRequestDto, PlaceMapResponseDto } from './dto/place-map.dto';
import { PlaceService } from './place.service';

@ApiTags('Place')
@Controller('place')
export class PlaceController {
    constructor(private readonly placeService: PlaceService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Список мест' })
    @ApiOkResponse({ type: PlaceListResponseDto })
    @ApiErrorResponses(401)
    async list(@CurrentActor() actor: Actor, @Query() query: PlaceListQueryDto): Promise<PlaceListResponseDto> {
        return this.placeService.list(actor, query);
    }

    @Post('map')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Места для карты' })
    @ApiOkResponse({ type: PlaceMapResponseDto })
    @ApiErrorResponses(400, 401)
    async map(@CurrentActor() actor: Actor, @Body() dto: PlaceMapRequestDto): Promise<PlaceMapResponseDto> {
        return this.placeService.map(actor, dto);
    }

    @Get('map/filters')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Страны, регионы и города мест пользователя' })
    @ApiOkResponse({ type: PlaceMapFiltersDto })
    @ApiErrorResponses(401)
    async mapFilters(@CurrentActor() actor: Actor): Promise<PlaceMapFiltersDto> {
        return this.placeService.getMapFilters(actor);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Удаление места (отвязка от всех заметок)' })
    @ApiNoContentResponse()
    @ApiErrorResponses(401, 404)
    async delete(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.placeService.delete(actor, id);
    }
}
