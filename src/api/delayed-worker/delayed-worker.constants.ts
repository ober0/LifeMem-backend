import { LangEnum } from '../../common/types/common/lang.enum';
import { EntryPipelinesEnum } from '../entry-processing/pipelines';

export const DELAYED_QUEUE = 'delayed' as const;
export const ENTRY_QUEUE = 'entry' as const;
export const AI_QUEUE = 'ai' as const;
export const LOCAL_EMBEDDING_QUEUE = 'local-embedding' as const;

export const DelayedJob = {
    // ENTRY_QUEUE
    EntryLocation: 'entry-location',
    EntryStt: 'entry-stt',
    EntryVision: 'entry-vision',
    EntryLocationAndPeopleDetect: 'entry-location-and-people-detect',
    EntryEmbedText: 'entry-embed-text',
    EntryEmbedTitle: 'entry-embed-title',
    EntryEmbedImage: 'entry-embed-image',

    // AI_QUEUE
    AiRefreshModels: 'ai-refresh-models',
    AiAddModels: 'ai-add-models',

    // LOCAL_EMBEDDING_QUEUE
    LocalEmbed: 'local-embed',
    LocalLoadModel: 'local-load-model'
} as const;

export type DelayedJobName = (typeof DelayedJob)[keyof typeof DelayedJob];

export type AiJobName = typeof DelayedJob.AiRefreshModels | typeof DelayedJob.AiAddModels;
export type LocalEmbeddingJobName = typeof DelayedJob.LocalEmbed | typeof DelayedJob.LocalLoadModel;
//TODO нормально сделать
export type EntryJobName = Exclude<DelayedJobName, AiJobName | LocalEmbeddingJobName>;

export interface baseEntryJobPayload {
    pipeline: EntryPipelinesEnum;
    jobId: string;
    userId: string;
    entryId: string;
}

export type EntryLocationCoordPayload = {
    latitude: number;
    longitude: number;
    locationLabel?: string;
};

// TODO в types
export type LocalEmbedJobPayload = {
    modelName: string;
    text: string;
    kind?: 'query' | 'passage';
};

export type LocalEmbedJobResult = {
    embedding: number[];
    dims: number;
};

export type LocalLoadModelJobPayload = {
    modelName: string;
};
export type DelayedJobPayloads = {
    //entry
    [DelayedJob.EntryLocation]: baseEntryJobPayload & {
        locations: EntryLocationCoordPayload[];
        userLang?: LangEnum;
    };
    [DelayedJob.EntryStt]: baseEntryJobPayload & {
        userLang?: LangEnum;
    };
    [DelayedJob.EntryVision]: baseEntryJobPayload & {
        entryVideoIds?: string[];
        userLang?: LangEnum;
    };
    [DelayedJob.EntryLocationAndPeopleDetect]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedText]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedTitle]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedImage]: baseEntryJobPayload & { entryVideoIds?: string[] };

    //ai
    [DelayedJob.AiRefreshModels]: Record<string, never>;
    [DelayedJob.AiAddModels]: Record<string, never>;

    //embed
    [DelayedJob.LocalEmbed]: LocalEmbedJobPayload;
    [DelayedJob.LocalLoadModel]: LocalLoadModelJobPayload;
};
