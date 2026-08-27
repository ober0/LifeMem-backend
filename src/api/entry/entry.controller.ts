import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { BaseEntryDto, BaseEntryUpdateDto } from './dto/base';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import { EntryService } from './entry.service';
import { parseLocations } from './helpers/parse-form-data.helper';
import { createSchema } from './types/entry.schema';
import type { UploadedEntryFiles } from './types/uploaded-file.type';

@ApiTags('Entry')
@Controller('entry')
export class EntryController {
    constructor(private readonly entryService: EntryService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuardHttp({}))
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'voice', maxCount: 1 },
            { name: 'photos', maxCount: appConstants.entry.maxPhotosPerEntry }
        ])
    )
    @ApiOperation({ summary: 'Создание заметки' })
    @ApiConsumes('multipart/form-data')
    @ApiBody(createSchema)
    @ApiCreatedResponse({ type: CreateEntryResponseDto })
    @ApiErrorResponses(400, 401, 404)
    async create(
        @CurrentActor() actor: Actor,
        @Body() dto: CreateEntryDto,
        @Req() req: Request,
        @UploadedFiles() files: UploadedEntryFiles
    ): Promise<CreateEntryResponseDto> {
        const locations = parseLocations(req.body?.location);

        return this.entryService.create(actor, dto, files, locations);
    }

    @Patch(':id/base')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Обновления базовой информации (после загрузки)' })
    @ApiOkResponse({ type: BaseEntryDto })
    @ApiErrorResponses(400, 401, 404)
    async updateBase(
        @CurrentActor() actor: Actor,
        @Param('id') id: string,
        @Body() dto: BaseEntryUpdateDto
    ): Promise<BaseEntryDto> {
        return this.entryService.updateBase(actor, id, dto);
    }
}
