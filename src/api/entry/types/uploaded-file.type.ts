import { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';

import type { EntryLocationDto } from '../dto/create-entry.dto';

export type CreateEntryMediaInput = {
    fileId: string;
    description?: string | null;
};

export type CreateEntryVoiceInput = {
    fileId: string;
};

export type CreateEntryJobInput = {
    type: EntryProcessingType;
    status?: EntryProcessingStatus;
};

export type CreateEntryInput = {
    userId: string;
    title: string;
    text?: string | null;
    location?: EntryLocationDto | null;
    personIds: string[];
    placeIds: string[];
    voice?: CreateEntryVoiceInput;
    media: CreateEntryMediaInput[];
    jobs?: CreateEntryJobInput[];
};
