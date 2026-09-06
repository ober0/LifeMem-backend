export const DelayedJob = {
    // entry
    EntryLocation: 'entry-location',
    EntryStt: 'entry-stt',
    EntryVision: 'entry-vision',
    EntryLocationAndPeopleDetect: 'entry-location-and-people-detect',
    EntryEmbedText: 'entry-embed-text',
    EntryEmbedTitle: 'entry-embed-title',
    EntryEmbedImage: 'entry-embed-image',

    // ai
    AiRefreshModels: 'ai-refresh-models',
    AiAddModels: 'ai-add-models',

    // local-embedding
    LocalEmbed: 'local-embed',
    LocalLoadModel: 'local-load-model'
} as const;

export type {
    baseEntryJobPayload,
    DelayedJobName,
    DelayedJobPayloads,
    EntryJobName,
    EntryLocationCoordPayload,
    LocalEmbedJobPayload,
    LocalEmbedJobResult,
    LocalLoadModelJobPayload
} from './delayed-worker.types';
