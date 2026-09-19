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
        type: EntryProcessingType.EmbedImage,
        requires: () => [DelayedJob.EntryVision],
        when: (ctx) => ctx.hasMedia
    }
};
