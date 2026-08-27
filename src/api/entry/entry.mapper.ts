import type { BaseEntryDto, EntryRelations } from './dto/base';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryImageDto } from './dto/entry-images';
import { BaseEntrySource, CreateEntrySource, EntryImageSource, EntryRelationSource } from './dto/types';

function toRelations(items: EntryRelationSource[]): EntryRelations[] {
    return items.map(({ id, name }) => ({ id, name }));
}

export const entryMapper = {
    toImage(image: EntryImageSource, url: string): EntryImageDto {
        return {
            id: image.id,
            fileId: image.fileId,
            description: image.description,
            url,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt
        };
    },

    toCreateResponse(entry: CreateEntrySource, images: EntryImageDto[]): CreateEntryResponseDto {
        return {
            id: entry.id,
            images,
            places: {
                ready: entry.places.ready,
                processing: entry.places.processing
            }
        };
    },

    toBaseEntry(entry: BaseEntrySource, images: EntryImageDto[]): BaseEntryDto {
        return {
            id: entry.id,
            title: entry.title,
            text: entry.text,
            isHasVoice: entry.isHasVoice,
            images,
            isReady: entry.isReady,
            peoples: toRelations(entry.peoples),
            places: toRelations(entry.places),
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
        };
    }
};
