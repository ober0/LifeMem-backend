import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { CompleteUploadResponseDto } from './dto/complete-upload.dto';
import { CreateUploadDto, CreateUploadResponseDto } from './dto/create-upload.dto';
import { UploadBatchRequestDto, UploadBatchResponseDto } from './dto/upload-batch.dto';
import { FilesService } from './files.service';

@ApiTags('Uploads')
@Controller('uploads')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Инициация загрузки' })
    @ApiCreatedResponse({ type: CreateUploadResponseDto })
    @ApiErrorResponses(400, 401)
    async create(@CurrentActor() actor: Actor, @Body() dto: CreateUploadDto): Promise<CreateUploadResponseDto> {
        return this.filesService.createUpload(dto, actor);
    }

    @Post(':id/batch')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'URLs для частей загрузки' })
    @ApiOkResponse({ type: UploadBatchResponseDto })
    @ApiErrorResponses(400, 401, 404)
    async batch(
        @CurrentActor() actor: Actor,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UploadBatchRequestDto
    ): Promise<UploadBatchResponseDto> {
        return this.filesService.createBatch(id, dto, actor);
    }

    @Post(':id/complete')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Завершение загрузки' })
    @ApiOkResponse({ type: CompleteUploadResponseDto })
    @ApiErrorResponses(400, 401, 404)
    async complete(
        @CurrentActor() actor: Actor,
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<CompleteUploadResponseDto> {
        return this.filesService.completeUpload(id, actor);
    }
}
