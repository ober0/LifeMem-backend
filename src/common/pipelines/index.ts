import {
    CreateEntryPipeline,
    UpdateBaseEntryPipeline,
    UpdateContentEntryPipeline,
    UpdateMediaDetachEntryPipeline,
    UpdateMediaEntryPipeline
} from './pipelines';
import { EntryPipeline } from './types';

export enum EntryPipelinesEnum {
    Create = 'create',
    UpdateBase = 'update-base',
    UpdateContent = 'update-content',
    UpdateMedia = 'update-media',
    UpdateMediaDetach = 'update-media-detach'
}

export const EntryPipelines: Record<EntryPipelinesEnum, EntryPipeline> = {
    [EntryPipelinesEnum.Create]: CreateEntryPipeline,
    [EntryPipelinesEnum.UpdateBase]: UpdateBaseEntryPipeline,
    [EntryPipelinesEnum.UpdateContent]: UpdateContentEntryPipeline,
    [EntryPipelinesEnum.UpdateMedia]: UpdateMediaEntryPipeline,
    [EntryPipelinesEnum.UpdateMediaDetach]: UpdateMediaDetachEntryPipeline
} as const;
