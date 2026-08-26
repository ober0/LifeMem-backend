import { EntryPipelinesEnum } from '../entry-processing/pipelines';

export const DELAYED_QUEUE = 'delayed' as const;
export const ENTRY_QUEUE = 'entry' as const;

export const DelayedJob = {
    EntryLocation: 'entry-location',
    EntryStt: 'entry-stt',
    EntryVision: 'entry-vision',
    EntryLocationDetect: 'entry-location-detect',
    EntryEmbedText: 'entry-embed-text',
    EntryEmbedTitle: 'entry-embed-title',
    EntryEmbedImage: 'entry-embed-image'
} as const;

export type DelayedJobName = (typeof DelayedJob)[keyof typeof DelayedJob];

export interface baseEntryJobPayload {
    pipeline: EntryPipelinesEnum;
    jobId: string;
    userId: string;
    entryId: string;
}

export type DelayedJobPayloads = {
    [DelayedJob.EntryLocation]: baseEntryJobPayload & {
        latitude: number;
        longitude: number;
        locationLabel?: string;
    };
    [DelayedJob.EntryStt]: baseEntryJobPayload;
    [DelayedJob.EntryVision]: baseEntryJobPayload;
    [DelayedJob.EntryLocationDetect]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedText]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedTitle]: baseEntryJobPayload;
    [DelayedJob.EntryEmbedImage]: baseEntryJobPayload;
};
