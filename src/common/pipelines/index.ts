import { CreateEntryPipeline, UpdateBaseEntryPipeline, UpdateImageEntryPipeline } from './pipelines';
import { EntryPipeline } from './types';

export enum EntryPipelinesEnum {
    Create = 'create',
    UpdateBase = 'update-base',
    UpdateImage = 'update-image'
}

export const EntryPipelines: Record<EntryPipelinesEnum, EntryPipeline> = {
    [EntryPipelinesEnum.Create]: CreateEntryPipeline,
    [EntryPipelinesEnum.UpdateBase]: UpdateBaseEntryPipeline,
    [EntryPipelinesEnum.UpdateImage]: UpdateImageEntryPipeline
} as const;
