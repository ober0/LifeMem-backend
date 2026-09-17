import { CreateEntryPipeline } from './pipelines/create';
import { EntryPipeline } from './types';

export enum EntryPipelinesEnum {
    Create = 'create'
}

export const EntryPipelines: Record<EntryPipelinesEnum, EntryPipeline> = {
    [EntryPipelinesEnum.Create]: CreateEntryPipeline
} as const;
