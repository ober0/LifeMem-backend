import type { BaseEntryDto, EntryRelations } from './dto/base';
import type { LocationDto } from './dto/create-entry.dto';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryImageDto } from './dto/entry-images';
import { BaseEntrySource, CreateEntrySource, EntryImageSource, EntryRelationSource } from './dto/types';

function toLocation(source: Pick<BaseEntrySource, 'latitude' | 'longitude' | 'locationLabel'>): LocationDto {
    return {
        ...(source.latitude != null && { latitude: source.latitude }),
        ...(source.longitude != null && { longitude: source.longitude }),
        ...(source.locationLabel != null && { locationLabel: source.locationLabel })
    };
}

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
            jobs: entry.jobs,
            images,
            peoples: toRelations(entry.peoples),
            places: toRelations(entry.places)
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
            location: toLocation(entry),
            peoples: toRelations(entry.peoples),
            places: toRelations(entry.places),
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
        };
    }
};
