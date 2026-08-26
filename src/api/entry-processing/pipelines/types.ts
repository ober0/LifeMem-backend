import { EntryProcessingType } from '@prisma/client';

import type { DelayedJobName } from '../../delayed-worker/delayed-worker.constants';

export type PipelineContext = {
    hasCoords: boolean;
    hasVoice: boolean;
    hasText: boolean;
    hasImage: boolean;
};

export type PipelineStep = {
    type: EntryProcessingType;
    requires: (ctx: PipelineContext) => DelayedJobName[];
    when?: (ctx: PipelineContext) => boolean;
};

export type EntryPipeline = Partial<Record<DelayedJobName, PipelineStep>>;
