import type { EntryFormattedTextFormat } from '@prisma/client';

import { EntryPlacesResponse } from './create-entry-response.dto';
import type { EntryMediaDto } from './entry-media.dto';
import { EntryVoiceDto } from './entry-voices';

export type EntryRelationSource = {
    id: string;
    name: string;
};

export type EntryMediaSource = {
    id: string;
    fileId: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type EntryVoiceSource = {
    id: string;
    fileId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateEntrySource = {
    id: string;
    places: EntryPlacesResponse;
    media: EntryMediaDto[];
    voice: EntryVoiceDto | null;
};

export type BaseEntrySource = {
    id: string;
    title: string;
    text: string | null;
    formattedText: string | null;
    formattedTextFormat: EntryFormattedTextFormat | null;
    isHasVoice: boolean;
    isReady: boolean;
    peoples: EntryRelationSource[];
    places: EntryRelationSource[];
    createdAt: Date;
    updatedAt: Date;
};
