import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const UpdateBaseEntryPipeline: EntryPipeline = {
    [DelayedJob.EntryLocation]: {
        type: EntryProcessingType.LocationConnect,
        requires: () => [],
        when: (ctx) => ctx.hasCoords
    },
    [DelayedJob.EntryEmbedTitle]: {
        type: EntryProcessingType.EmbedTitle,
        requires: () => []
    }
};
