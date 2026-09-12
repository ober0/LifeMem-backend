import type { EntryDetailSource, SearchEntrySource } from './consts/entry.constants';
import { entryBaseMapper } from './entry-base.mapper';
import type { BaseEntryDto, EntryRelations } from './dto/base';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryImageDto } from './dto/entry-images';
import { EntryVoiceDto } from './dto/entry-voices';
import type { EntryDetailResponseDto } from './dto/get-entry-response.dto';
import type { EntrySearchItemDto } from './dto/search/search-response.dto';
import {
    BaseEntrySource,
    CreateEntrySource,
    EntryImageSource,
    EntryRelationSource,
    EntryVoiceSource
} from './dto/types';
import { calcEntryProcessingStatus } from './helpers/entry.helper';

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

    toVoice(image: EntryVoiceSource, url: string): EntryVoiceDto {
        return {
            id: image.id,
            fileId: image.fileId,
            url,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt
        };
    },

    toCreateResponse(entry: CreateEntrySource): CreateEntryResponseDto {
        return {
            id: entry.id,
            images: entry.images,
            voice: entry.voice ?? null,
            places: {
                ready: entry.places.ready,
                processing: entry.places.processing
            }
        };
    },

    toBaseEntry(entry: BaseEntrySource, images: EntryImageDto[]): BaseEntryDto {
        return {
            ...entryBaseMapper.withTimestamps(entry),
            isHasVoice: entry.isHasVoice,
            images,
            peoples: toRelations(entry.peoples),
            places: toRelations(entry.places)
        };
    },

    toDetail(entry: EntryDetailSource, photos: EntryImageDto[], voice: EntryVoiceDto | null): EntryDetailResponseDto {
        return {
            ...entryBaseMapper.withTimestamps(entry),
            userId: entry.userId,
            voice,
            photos,
            jobs: entry.jobs.map((job) => ({
                id: job.id,
                type: job.type,
                status: job.status,
                errorMessages: job.errorMessages,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt
            })),
            people: entry.people.map(({ person }) => ({
                id: person.id,
                name: person.name,
                createdAt: person.createdAt
            })),
            places: entry.places.map(({ place }) => ({
                id: place.id,
                name: place.name,
                createdAt: place.createdAt
            }))
        };
    },

    toSearchItem(entry: SearchEntrySource): EntrySearchItemDto {
        return {
            ...entryBaseMapper.withReady(entry),
            isHasVoice: Boolean(entry.voice),
            photoCount: entry._count.images,
            processingStatus: calcEntryProcessingStatus(entry.jobs),
            peopleCount: entry._count.people,
            placesCount: entry._count.places
        };
    }
};
