import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const UpdateEntryPipeline: EntryPipeline = {
    [DelayedJob.EntryLocation]: {
        type: EntryProcessingType.LocationConnect,
        requires: () => [],
        when: (ctx) => ctx.hasCoords
    },
    [DelayedJob.EntryLocationAndPeopleDetect]: {
        type: EntryProcessingType.LocationAndPeopleDetect,
        requires: (ctx) => (ctx.hasVoice ? [DelayedJob.EntryStt] : []),
        when: (ctx) => ctx.hasCoords || ctx.hasText
    },
    [DelayedJob.EntryVision]: {
        type: EntryProcessingType.Vision,
        requires: () => [],
        when: (ctx) => ctx.hasImage
    },
    [DelayedJob.EntryEmbedImage]: {
        type: EntryProcessingType.EmbedImage,
        requires: () => [DelayedJob.EntryVision],
        when: (ctx) => ctx.hasImage
    },
    [DelayedJob.EntryEmbedTitle]: {
        type: EntryProcessingType.EmbedTitle,
        requires: () => []
    },
    [DelayedJob.EntryEmbedText]: {
        type: EntryProcessingType.EmbedText,
        requires: () => [],
        when: (ctx) => ctx.hasText
    }
};
