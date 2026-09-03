import { LangEnum } from '../../common/types/common/lang.enum';
import { EntryPipelinesEnum } from '../entry-processing/pipelines';

export const DELAYED_QUEUE = 'delayed' as const;
export const ENTRY_QUEUE = 'entry' as const;
export const AI_QUEUE = 'ai' as const;

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
    AiAddModels: 'ai-add-models'
} as const;

export type DelayedJobName = (typeof DelayedJob)[keyof typeof DelayedJob];

export type AiJobName = typeof DelayedJob.AiRefreshModels | typeof DelayedJob.AiAddModels;
export type EntryJobName = Exclude<DelayedJobName, AiJobName>;

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

export type DelayedJobPayloads = {
    [DelayedJob.EntryLocation]: baseEntryJobPayload & {
        locations: EntryLocationCoordPayload[];
        userLang?: LangEnum;
    };
    [DelayedJob.EntryStt]: baseEntryJobPayload;
    [DelayedJob.EntryVision]: baseEntryJobPayload;
    [DelayedJob.EntryLocationAndPeopleDetect]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedText]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedTitle]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedImage]: baseEntryJobPayload;
    [DelayedJob.AiRefreshModels]: Record<string, never>;
    [DelayedJob.AiAddModels]: Record<string, never>;
};
