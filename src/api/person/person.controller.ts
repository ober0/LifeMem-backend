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
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonDto, PersonListResponseDto } from './dto/person.dto';
import { PersonListQueryDto } from './dto/person-list-query.dto';
import { PersonService } from './person.service';

@ApiTags('Person')
@Controller('person')
export class PersonController {
    constructor(private readonly personService: PersonService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Список людей' })
    @ApiOkResponse({ type: PersonListResponseDto })
    @ApiErrorResponses(401)
    async list(@CurrentActor() actor: Actor, @Query() query: PersonListQueryDto): Promise<PersonListResponseDto> {
        return this.personService.list(actor, query);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Добавление человека' })
    @ApiCreatedResponse({ type: PersonDto })
    @ApiErrorResponses(400, 401, 409)
    async create(@CurrentActor() actor: Actor, @Body() dto: CreatePersonDto): Promise<PersonDto> {
        return this.personService.create(actor, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Удаление человека (отвязка от всех заметок)' })
    @ApiNoContentResponse()
    @ApiErrorResponses(401, 404)
    async delete(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.personService.delete(actor, id);
    }
}
