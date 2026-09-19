import { CreateEntryPipeline, UpdateEntryPipeline } from './pipelines';
import { EntryPipeline } from './types';

export enum EntryPipelinesEnum {
    Create = 'create',
    Update = 'update'
}

export const EntryPipelines: Record<EntryPipelinesEnum, EntryPipeline> = {
    [EntryPipelinesEnum.Create]: CreateEntryPipeline,
    [EntryPipelinesEnum.Update]: UpdateEntryPipeline
} as const;
