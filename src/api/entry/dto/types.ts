import type { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';

import { EntryPlacesResponse } from './create-entry-response.dto';

export type EntryRelationSource = {
    id: string;
    name: string;
};

export type EntryImageSource = {
    id: string;
    fileId: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateEntryJobSource = {
    type: EntryProcessingType;
    status: EntryProcessingStatus;
};

export type CreateEntrySource = {
    id: string;
    places: EntryPlacesResponse;
};

export type BaseEntrySource = {
    id: string;
    title: string;
    text: string | null;
    isHasVoice: boolean;
    isReady: boolean;
    peoples: EntryRelationSource[];
    places: EntryRelationSource[];
    createdAt: Date;
    updatedAt: Date;
};
