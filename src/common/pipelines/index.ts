import { CreateEntryPipeline, UpdateBaseEntryPipeline, UpdateMediaEntryPipeline } from './pipelines';
import { EntryPipeline } from './types';

export enum EntryPipelinesEnum {
    Create = 'create',
    UpdateBase = 'update-base',
    UpdateMedia = 'update-media'
}

export const EntryPipelines: Record<EntryPipelinesEnum, EntryPipeline> = {
    [EntryPipelinesEnum.Create]: CreateEntryPipeline,
    [EntryPipelinesEnum.UpdateBase]: UpdateBaseEntryPipeline,
    [EntryPipelinesEnum.UpdateMedia]: UpdateMediaEntryPipeline
} as const;
