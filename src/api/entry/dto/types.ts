import type { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';

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
    jobs: CreateEntryJobSource[];
    peoples: EntryRelationSource[];
    places: EntryRelationSource[];
};

export type BaseEntrySource = {
    id: string;
    title: string;
    text: string | null;
    isHasVoice: boolean;
    isReady: boolean;
    latitude: number | null;
    longitude: number | null;
    locationLabel: string | null;
    peoples: EntryRelationSource[];
    places: EntryRelationSource[];
    createdAt: Date;
    updatedAt: Date;
};
