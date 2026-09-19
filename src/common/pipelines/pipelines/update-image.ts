import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const UpdateImageEntryPipeline: EntryPipeline = {
    [DelayedJob.EntryVision]: {
        type: EntryProcessingType.Vision,
        requires: () => [],
        when: (ctx) => ctx.hasImage
    },
    [DelayedJob.EntryEmbedImage]: {
        type: EntryProcessingType.EmbedImage,
        requires: () => [DelayedJob.EntryVision],
        when: (ctx) => ctx.hasImage
    }
};
