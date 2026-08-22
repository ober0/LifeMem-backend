import { FileType } from '@prisma/client';

import { LocationDto } from '../dto/create-entry.dto';

export type UploadedFile = {
    fieldname: string;
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};

export type UploadedEntryFiles = {
    voice?: UploadedFile[];
    photos?: UploadedFile[];
};

export type CreateEntryFileInput = {
    key: string;
    filename?: string;
    mimeType?: string;
    size: bigint;
    type: FileType;
};

export type CreateEntryInput = {
    userId: string;
    title: string;
    text?: string | null;
    location?: LocationDto | null;
    personIds: string[];
    placeIds: string[];
    voice?: CreateEntryFileInput;
    images: CreateEntryFileInput[];
};
