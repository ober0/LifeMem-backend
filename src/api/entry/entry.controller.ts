import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { AttachEntryMediaDto } from './dto/attach-entry-media.dto';
import { BaseEntryDto, BaseEntryUpdateDto } from './dto/base';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import { EntryMediaDto } from './dto/entry-media.dto';
import { EntryDetailResponseDto } from './dto/get-entry-response.dto';
import { LinkEntryPersonDto } from './dto/link-entry-person.dto';
import { LinkEntryPlaceDto } from './dto/link-entry-place.dto';
import { EntrySearchDto } from './dto/search/search-request.dto';
import { EntrySearchResponseDto } from './dto/search/search-response.dto';
import { UpdateEntryContentDto } from './dto/update-entry-content.dto';
import { EntryService } from './entry.service';

@ApiTags('Entry')
@Controller('entry')
export class EntryController {
    constructor(private readonly entryService: EntryService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Создание заметки' })
    @ApiCreatedResponse({ type: CreateEntryResponseDto })
    @ApiErrorResponses(400, 401, 404)
    async create(@CurrentActor() actor: Actor, @Body() dto: CreateEntryDto): Promise<CreateEntryResponseDto> {
        return this.entryService.create(actor, dto);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Получение заметки по id' })
    @ApiOkResponse({ type: EntryDetailResponseDto })
    @ApiErrorResponses(401, 404)
    async getById(@CurrentActor() actor: Actor, @Param('id') id: string): Promise<EntryDetailResponseDto> {
        return this.entryService.getById(actor, id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Удаление заметки (soft)' })
    @ApiErrorResponses(401, 404)
    async delete(@CurrentActor() actor: Actor, @Param('id') id: string): Promise<void> {
        await this.entryService.softDelete(actor, id);
    }

    @Post(':id/media')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Прикрепить фото или видео к заметке' })
    @ApiCreatedResponse({ type: EntryMediaDto })
    @ApiErrorResponses(400, 401, 404)
    async attachMedia(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Body() dto: AttachEntryMediaDto
    ): Promise<EntryMediaDto> {
        return this.entryService.attachMedia(actor, id, dto);
    }

    @Delete(':id/media/:mediaId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Открепить медиа от заметки' })
    @ApiErrorResponses(401, 404)
    async detachMedia(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Param('mediaId') mediaId: string
    ): Promise<void> {
        await this.entryService.detachMedia(actor, id, mediaId);
    }

    @Patch(':id/base')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Обновление базовой информации' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async updateBase(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Body() dto: BaseEntryUpdateDto
    ): Promise<BaseEntryDto> {
        return this.entryService.updateBase(actor, id, dto);
    }

    @Patch(':id/content')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Обновление готовой заметки' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async updateContent(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Body() dto: UpdateEntryContentDto
    ): Promise<BaseEntryDto> {
        return this.entryService.updateContent(actor, id, dto);
    }

    @Post(':id/people')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Привязать человека к готовой заметке' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async addPerson(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Body() dto: LinkEntryPersonDto
    ): Promise<BaseEntryDto> {
        return this.entryService.addPerson(actor, id, dto);
    }

    @Delete(':id/people/:personId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Отвязать человека от готовой заметки' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async removePerson(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Param('personId') personId: string
    ): Promise<BaseEntryDto> {
        return this.entryService.removePerson(actor, id, personId);
    }

    @Post(':id/places')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Привязать место к готовой заметке' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async addPlace(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Body() dto: LinkEntryPlaceDto
    ): Promise<BaseEntryDto> {
        return this.entryService.addPlace(actor, id, dto);
    }

    @Delete(':id/places/:placeId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Отвязать место от готовой заметки' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async removePlace(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Param('placeId') placeId: string
    ): Promise<BaseEntryDto> {
        return this.entryService.removePlace(actor, id, placeId);
    }

    @Post('search')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Поиск заметок' })
    @ApiOkResponse({ type: EntrySearchResponseDto })
    @ApiErrorResponses(400, 401)
    async search(@CurrentActor() actor: Actor, @Body() dto: EntrySearchDto): Promise<EntrySearchResponseDto> {
        return this.entryService.search(actor, dto);
    }
}
