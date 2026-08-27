import { LangEnum } from '../../common/types/common/lang.enum';
import { EntryPipelinesEnum } from '../entry-processing/pipelines';

export const DELAYED_QUEUE = 'delayed' as const;
export const ENTRY_QUEUE = 'entry' as const;

export const DelayedJob = {
    EntryLocation: 'entry-location',
    EntryStt: 'entry-stt',
    EntryVision: 'entry-vision',
    EntryLocationAndPeopleDetect: 'entry-location-and-people-detect',
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
};
