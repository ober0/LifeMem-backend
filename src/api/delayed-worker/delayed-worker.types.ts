import { LangEnum } from '../../common/types/common/lang.enum';
import { EntryPipelinesEnum } from '../entry-processing/pipelines';
import { DelayedJob } from './delayed-worker.constants';

export type DelayedJobName = (typeof DelayedJob)[keyof typeof DelayedJob];

export type AiJobName = typeof DelayedJob.AiRefreshModels | typeof DelayedJob.AiAddModels;
export type LocalEmbeddingJobName = typeof DelayedJob.LocalEmbed | typeof DelayedJob.LocalLoadModel;

export type EntryJobName =
    | typeof DelayedJob.EntryLocation
    | typeof DelayedJob.EntryStt
    | typeof DelayedJob.EntryVision
    | typeof DelayedJob.EntryLocationAndPeopleDetect
    | typeof DelayedJob.EntryEmbedText
    | typeof DelayedJob.EntryEmbedTitle
    | typeof DelayedJob.EntryEmbedImage;

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
