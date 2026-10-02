import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../api/delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const UpdateContentEntryPipeline: EntryPipeline = {
    [DelayedJob.EntryEmbedTitle]: {
        type: EntryProcessingType.EmbedTitle,
        requires: () => []
    },
    [DelayedJob.EntryEmbedText]: {
        type: EntryProcessingType.EmbedText,
        requires: () => []
    },
    [DelayedJob.EntryLocationAndPeopleDetect]: {
        type: EntryProcessingType.LocationAndPeopleDetect,
        requires: () => [],
        when: (ctx) => ctx.hasText
    }
};
