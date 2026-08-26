import type { CreateEntryResponseDto } from './create-entry-response.dto';

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

export type CreateEntrySource = {
    id: string;
    status: CreateEntryResponseDto['status'];
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
