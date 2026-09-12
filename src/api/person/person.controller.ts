import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { PersonListResponseDto } from './dto/person.dto';
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
}
