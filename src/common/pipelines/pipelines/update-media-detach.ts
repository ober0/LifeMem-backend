import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const UpdateMediaDetachEntryPipeline: EntryPipeline = {
    [DelayedJob.EntryEmbedImage]: {
        type: EntryProcessingType.EmbedMedia,
        requires: () => [],
        when: (ctx) => ctx.hasMedia
    }
};
