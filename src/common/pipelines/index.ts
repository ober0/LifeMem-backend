import { CreateEntryPipeline, UpdateBaseEntryPipeline } from './pipelines';
import { EntryPipeline } from './types';

export enum EntryPipelinesEnum {
    Create = 'create',
    UpdateBase = 'update-base'
}

export const EntryPipelines: Record<EntryPipelinesEnum, EntryPipeline> = {
    [EntryPipelinesEnum.Create]: CreateEntryPipeline,
    [EntryPipelinesEnum.UpdateBase]: UpdateBaseEntryPipeline
} as const;
