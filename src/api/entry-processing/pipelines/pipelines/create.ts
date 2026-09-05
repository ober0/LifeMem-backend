import { EntryProcessingType } from '@prisma/client';

import { DelayedJob } from '../../../delayed-worker/delayed-worker.constants';
import { EntryPipeline } from '../types';

export const CreateEntryPipeline: EntryPipeline = {
    // [DelayedJob.EntryLocation]: {
    //     type: EntryProcessingType.LocationConnect,
    //     requires: () => [],
    //     when: (ctx) => ctx.hasCoords
    // },
    [DelayedJob.EntryStt]: {
        type: EntryProcessingType.Stt,
        requires: () => [],
        when: (ctx) => ctx.hasVoice
    },
    // [DelayedJob.EntryLocationAndPeopleDetect]: {
    //     type: EntryProcessingType.LocationAndPeopleDetect,
    //     requires: (ctx) => (ctx.hasVoice ? [DelayedJob.EntryStt] : []),
    //     when: (ctx) => ctx.hasCoords || ctx.hasText || ctx.hasVoice
    // },
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
    // [DelayedJob.EntryEmbedTitle]: {
    //     type: EntryProcessingType.EmbedTitle,
    //     requires: () => []
    // },
    // [DelayedJob.EntryEmbedText]: {
    //     type: EntryProcessingType.EmbedText,
    //     requires: (ctx) => {
    //         if (ctx.hasVoice) {
    //             return [DelayedJob.EntryStt];
    //         }
    //         return [];
    //     },
    //     when: (ctx) => ctx.hasVoice || ctx.hasText
    // }
};
