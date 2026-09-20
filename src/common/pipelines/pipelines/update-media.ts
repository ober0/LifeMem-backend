import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const UpdateMediaEntryPipeline: EntryPipeline = {
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
    [DelayedJob.EntrySlicePreview]: {
        type: EntryProcessingType.SlicePreview,
        requires: () => [],
        when: (ctx) => ctx.hasVideoInMedia
    }
};
