import { Injectable } from '@nestjs/common';
import { FileType, UploadFileProcess, UploadStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type CreateUploadProcessInput = {
    userId: string;
    key: string;
    filename: string;
    declaredSize: bigint;
    declaredMimeType: string;
    type: FileType;
    isMultipart: boolean;
    partSizeBytes: number;
    totalParts: number;
    multipartUploadId?: string | null;
};

export type FinalizeUploadInput = {
    processId: string;
    userId: string;
    key: string;
    filename: string | null;
    mimeType: string;
    size: bigint;
    type: FileType;
    actualSize: bigint;
    actualMimeType: string;
};

@Injectable()
export class FilesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createUpload(data: CreateUploadProcessInput) {
        return this.prisma.uploadFileProcess.create({
            data: {
                userId: data.userId,
                key: data.key,
                filename: data.filename,
                declaredSize: data.declaredSize,
                declaredMimeType: data.declaredMimeType,
                type: data.type,
                status: UploadStatus.CREATED,
                partSizeBytes: data.partSizeBytes,
                totalParts: data.totalParts,
                isMultipart: data.isMultipart,
                multipartUploadId: data.multipartUploadId ?? null
            }
        });
    }

    async findOwnedById(id: string, userId: string) {
        return this.prisma.uploadFileProcess.findFirst({
            where: { id, userId }
        });
    }

    async updateStatus(id: string, status: UploadStatus) {
        return this.prisma.uploadFileProcess.update({
            where: { id },
            data: { status }
        });
    }

    async updateActualMeta(id: string, data: { actualSize: bigint; actualMimeType: string }) {
        return this.prisma.uploadFileProcess.update({
            where: { id },
            data: {
                actualSize: data.actualSize,
                actualMimeType: data.actualMimeType
            }
        });
    }

    async finalizeWithFile(data: FinalizeUploadInput) {
        return this.prisma.$transaction(async (tx) => {
            const file = await tx.file.create({
                data: {
                    key: data.key,
                    filename: data.filename,
                    mimeType: data.mimeType,
                    size: data.size,
                    type: data.type,
                    userId: data.userId
                }
            });

            await tx.uploadFileProcess.update({
                where: { id: data.processId },
                data: {
                    fileId: file.id,
                    status: UploadStatus.READY,
                    actualSize: data.actualSize,
                    actualMimeType: data.actualMimeType
                }
            });

            return file;
        });
    }

    async findAttachableFilesByIds(userId: string, ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        return this.prisma.file.findMany({
            where: {
                id: { in: ids },
                userId,
                uploadProcess: { status: UploadStatus.READY },
                entryMedia: { none: {} },
                entryMediaFirstFrames: { none: {} },
                entryVoice: { none: {} }
            }
        });
    }

    async deleteOwnedFile(userId: string, fileId: string): Promise<boolean> {
        const result = await this.prisma.file.deleteMany({
            where: {
                id: fileId,
                userId
            }
        });

        return result.count > 0;
    }

    async findExpiredProcesses(lte: Date): Promise<UploadFileProcess[]> {
        return this.prisma.uploadFileProcess.findMany({
            where: {
                status: { in: [UploadStatus.CREATED, UploadStatus.UPLOADING] },
                createdAt: { lte }
            }
        });
    }
}
