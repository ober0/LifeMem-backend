import { EntryProcessingType } from '@prisma/client';

import type { EntryJobName } from '../../delayed-worker/delayed-worker.constants';

export type PipelineContext = {
    hasCoords: boolean;
    hasVoice: boolean;
    hasText: boolean;
    hasImage: boolean;
};

export type PipelineStep = {
    type: EntryProcessingType;
    requires: (ctx: PipelineContext) => EntryJobName[];
    when?: (ctx: PipelineContext) => boolean;
};

export type EntryPipeline = Partial<Record<EntryJobName, PipelineStep>>;
