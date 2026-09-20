import { Injectable } from '@nestjs/common';
import { FileType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntrySlicePreviewRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getVideoMedia(entryId: string, ids?: string[]) {
        return this.prisma.entryMedia.findMany({
            where: {
                entryId,
                type: FileType.VIDEO,
                firstFrameId: null,
                ...(ids && {
                    id: {
                        in: ids
                    }
                })
            },
            select: {
                id: true,
                file: {
                    select: {
                        key: true
                    }
                }
            }
        });
    }

    async saveFirstFrame(params: {
        mediaId: string;
        userId: string;
        key: string;
        size: number;
        mimeType: string;
        filename: string;
    }) {
        return this.prisma.$transaction(async (tx) => {
            const file = await tx.file.create({
                data: {
                    key: params.key,
                    filename: params.filename,
                    mimeType: params.mimeType,
                    size: BigInt(params.size),
                    type: FileType.IMAGE,
                    userId: params.userId
                },
                select: { id: true }
            });

            await tx.entryMedia.update({
                where: { id: params.mediaId },
                data: { firstFrameId: file.id }
            });

            return file;
        });
    }
}
