import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { FileType, UploadStatus } from '@prisma/client';

import { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { AppConfig, appConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';
import { S3Service } from '../s3/s3.service';
import { CompleteUploadResponseDto } from './dto/complete-upload.dto';
import { CreateUploadDto, CreateUploadResponseDto } from './dto/create-upload.dto';
import { UploadBatchRequestDto, UploadBatchResponseDto } from './dto/upload-batch.dto';
import { FilesRepository } from './files.repository';
import { isMultipartUpload, validateActualObject, validateUploadInitPayload } from './helpers/upload-validation.helper';

const BATCH_ALLOWED_STATUSES: UploadStatus[] = [UploadStatus.CREATED, UploadStatus.UPLOADING];
const COMPLETE_ALLOWED_STATUSES: UploadStatus[] = [UploadStatus.UPLOADING];

@Injectable()
export class FilesService {
    constructor(
        private readonly filesRepository: FilesRepository,
        private readonly s3: S3Service,
        @Inject(appConfig.KEY) private readonly app: AppConfig
    ) {}

    private async getOwnedUploadOrThrow(id: string, userId: string) {
        const upload = await this.filesRepository.findOwnedById(id, userId);
        if (!upload) {
            throw apiError.notFound('files.upload_not_found');
        }

        return upload;
    }

    private async ensureStorageObjectOrSubstituteTestImage(upload: { key: string; type: FileType }): Promise<void> {
        if (await this.s3.objectExists(upload.key)) {
            return;
        }

        if (this.app.nodeEnv !== 'development' || upload.type !== FileType.IMAGE) {
            throw apiError.badRequest('files.storage_object_not_found');
        }

        const testKey = appConstants.files.testFilePath;
        if (!(await this.s3.objectExists(testKey))) {
            throw apiError.badRequest('files.storage_object_not_found');
        }

        const [body, head] = await Promise.all([this.s3.getObjectBuffer(testKey), this.s3.headObject(testKey)]);

        await this.s3.upload({
            key: upload.key,
            body,
            contentType: head.contentType
        });
    }

    async createUpload(dto: CreateUploadDto, actor: Actor): Promise<CreateUploadResponseDto> {
        const userId = actor.user.id;
        const mimeType = validateUploadInitPayload({
            type: dto.type,
            filename: dto.filename,
            size: dto.size,
            mimeType: dto.mimeType
        });

        const { files } = appConstants;
        const key = `user/${userId}/files/${dto.type.toLowerCase()}/${randomUUID()}`;
        const isMultipart = isMultipartUpload(dto.size);
        const partSizeBytes = files.batchSizeBytes;
        const totalParts = isMultipart ? Math.ceil(dto.size / partSizeBytes) : 1;

        let multipartUploadId: string | null = null;
        if (isMultipart) {
            multipartUploadId = await this.s3.createMultipartUpload({
                key,
                contentType: mimeType
            });
        }

        const process = await this.filesRepository.createUpload({
            userId,
            key,
            filename: dto.filename,
            declaredSize: BigInt(dto.size),
            declaredMimeType: mimeType,
            type: dto.type,
            isMultipart,
            partSizeBytes,
            totalParts,
            multipartUploadId
        });

        if (!isMultipart) {
            const [uploadUrl, _] = await Promise.all([
                this.s3.createUploadUrl({
                    key,
                    contentType: mimeType,
                    expiresIn: files.uploadPresignExpiresInSec
                }),
                this.filesRepository.updateStatus(process.id, UploadStatus.UPLOADING)
            ]);

            return {
                id: process.id,
                isMultipart,
                uploadUrl
            };
        }

        return {
            id: process.id,
            isMultipart,
            partSizeBytes,
            totalParts
        };
    }

    async createBatch(uploadId: string, dto: UploadBatchRequestDto, actor: Actor): Promise<UploadBatchResponseDto> {
        const userId = actor.user.id;
        const upload = await this.getOwnedUploadOrThrow(uploadId, userId);

        if (!upload.isMultipart) {
            throw apiError.badRequest('files.upload_not_multipart');
        }

        if (!BATCH_ALLOWED_STATUSES.includes(upload.status)) {
            throw apiError.badRequest('files.upload_invalid_status');
        }

        const uniqueParts = new Set(dto.parts);
        if (uniqueParts.size !== dto.parts.length) {
            throw apiError.badRequest('files.duplicate_part_numbers');
        }

        for (const partNumber of dto.parts) {
            if (partNumber > upload.totalParts) {
                throw apiError.badRequest('files.invalid_part_number', { totalParts: upload.totalParts });
            }
        }

        const { files } = appConstants;
        const parts: UploadBatchResponseDto['parts'] = [];

        if (!upload.multipartUploadId) {
            throw apiError.badRequest('files.multipart_upload_id_missing');
        }

        const { uploadMultipartPresignExpiresInSec, presignUrlParallelBatchSize } = files;

        for (let offset = 0; offset < dto.parts.length; offset += presignUrlParallelBatchSize) {
            const chunk = dto.parts.slice(offset, offset + presignUrlParallelBatchSize);
            const chunkParts = await Promise.all(
                chunk.map(async (partNumber) => ({
                    partNumber,
                    url: await this.s3.createMultipartUploadUrl({
                        key: upload.key,
                        uploadId: upload.multipartUploadId!,
                        partNumber,
                        expiresIn: uploadMultipartPresignExpiresInSec
                    })
                }))
            );

            parts.push(...chunkParts);
        }

        if (upload.status === UploadStatus.CREATED) {
            await this.filesRepository.updateStatus(upload.id, UploadStatus.UPLOADING);
        }

        return { parts };
    }

    async completeUpload(uploadId: string, actor: Actor): Promise<CompleteUploadResponseDto> {
        const userId = actor.user.id;
        const upload = await this.getOwnedUploadOrThrow(uploadId, userId);

        if (!COMPLETE_ALLOWED_STATUSES.includes(upload.status)) {
            throw apiError.badRequest('files.upload_invalid_status');
        }

        if (upload.isMultipart) {
            if (!upload.multipartUploadId) {
                throw apiError.badRequest('files.multipart_upload_id_missing');
            }

            const listedParts = await this.s3.listMultipartParts({
                key: upload.key,
                uploadId: upload.multipartUploadId
            });

            if (listedParts.length !== upload.totalParts) {
                throw apiError.badRequest('files.multipart_parts_incomplete');
            }

            const partNumbers = new Set(listedParts.map((part) => part.partNumber));
            for (let partNumber = 1; partNumber <= upload.totalParts; partNumber += 1) {
                if (!partNumbers.has(partNumber)) {
                    throw apiError.badRequest('files.multipart_parts_incomplete');
                }
            }

            await this.s3.completeMultipartUpload({
                key: upload.key,
                uploadId: upload.multipartUploadId,
                parts: listedParts
            });
        } else {
            // тут логика для дебага, для дев окружения если файла нет - подставится тестовый
            await this.ensureStorageObjectOrSubstituteTestImage(upload);
        }

        await this.filesRepository.updateStatus(upload.id, UploadStatus.PROCESSING);

        try {
            const head = await this.s3.headObject(upload.key);
            const { actualSize, actualMimeType } = validateActualObject({
                type: upload.type,
                contentLength: head.contentLength,
                contentType: head.contentType
            });

            const file = await this.filesRepository.finalizeWithFile({
                processId: upload.id,
                userId,
                key: upload.key,
                filename: upload.filename,
                mimeType: actualMimeType,
                size: actualSize,
                type: upload.type,
                actualSize,
                actualMimeType
            });

            return {
                fileId: file.id,
                status: UploadStatus.READY
            };
        } catch (error) {
            await this.filesRepository.updateStatus(upload.id, UploadStatus.FAILED);
            throw error;
        }
    }
}
