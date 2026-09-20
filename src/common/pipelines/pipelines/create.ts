import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const CreateEntryPipeline: EntryPipeline = {
    [DelayedJob.EntryLocation]: {
        type: EntryProcessingType.LocationConnect,
        requires: () => [],
        when: (ctx) => ctx.hasCoords
    },
    [DelayedJob.EntryStt]: {
        type: EntryProcessingType.Stt,
        requires: () => [],
        when: (ctx) => ctx.hasVoice
    },
    [DelayedJob.EntryLocationAndPeopleDetect]: {
        type: EntryProcessingType.LocationAndPeopleDetect,
        requires: (ctx) => (ctx.hasVoice ? [DelayedJob.EntryStt] : []),
        when: (ctx) => ctx.hasCoords || ctx.hasText || ctx.hasVoice
    },
    [DelayedJob.EntryVision]: {
        type: EntryProcessingType.Vision,
        requires: () => [],
        when: (ctx) => ctx.hasMedia
    },
    [DelayedJob.EntryEmbedImage]: {
        type: EntryProcessingType.EmbedMedia,
        requires: () => [DelayedJob.EntryVision],
        when: (ctx) => ctx.hasMedia
    },
    [DelayedJob.EntryEmbedTitle]: {
        type: EntryProcessingType.EmbedTitle,
        requires: () => []
    },
    [DelayedJob.EntryEmbedText]: {
        type: EntryProcessingType.EmbedText,
        requires: (ctx) => {
            if (ctx.hasVoice) {
                return [DelayedJob.EntryStt];
            }
            return [];
        },
        when: (ctx) => ctx.hasVoice || ctx.hasText
    },
    [DelayedJob.EntrySlicePreview]: {
        type: EntryProcessingType.SlicePreview,
        requires: () => [],
        when: (ctx) => ctx.hasVideoInMedia
    }
};
