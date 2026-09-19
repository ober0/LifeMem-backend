import type { EntryDetailSource, SearchEntrySource } from './consts/entry.constants';
import type { BaseEntryDto, EntryRelations } from './dto/base';
import type { CreateEntryResponseDto } from './dto/create-entry-response.dto';
import type { EntryMediaDto } from './dto/entry-media.dto';
import { EntryVoiceDto } from './dto/entry-voices';
import type { EntryDetailResponseDto } from './dto/get-entry-response.dto';
import type { EntrySearchItemDto } from './dto/search/search-response.dto';
import {
    BaseEntrySource,
    CreateEntrySource,
    EntryMediaSource,
    EntryRelationSource,
    EntryVoiceSource
} from './dto/types';
import { entryBaseMapper } from './entry-base.mapper';
import { calcEntryProcessingStatus } from './helpers/entry.helper';

function toRelations(items: EntryRelationSource[]): EntryRelations[] {
    return items.map(({ id, name }) => ({ id, name }));
}

export const entryMapper = {
    toMedia(media: EntryMediaSource, url: string): EntryMediaDto {
        return {
            id: media.id,
            fileId: media.fileId,
            description: media.description,
            url,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt
        };
    },

    toVoice(voice: EntryVoiceSource, url: string): EntryVoiceDto {
        return {
            id: voice.id,
            fileId: voice.fileId,
            url,
            createdAt: voice.createdAt,
            updatedAt: voice.updatedAt
        };
    },

    toCreateResponse(entry: CreateEntrySource): CreateEntryResponseDto {
        return {
            id: entry.id,
            media: entry.media,
            voice: entry.voice ?? null,
            places: {
                ready: entry.places.ready,
                processing: entry.places.processing
            }
        };
    },

    toBaseEntry(entry: BaseEntrySource, media: EntryMediaDto[]): BaseEntryDto {
        return {
            ...entryBaseMapper.withTimestamps(entry),
            isHasVoice: entry.isHasVoice,
            media,
            peoples: toRelations(entry.peoples),
            places: toRelations(entry.places)
        };
    },

    toDetail(entry: EntryDetailSource, media: EntryMediaDto[], voice: EntryVoiceDto | null): EntryDetailResponseDto {
        return {
            ...entryBaseMapper.withTimestamps(entry),
            userId: entry.userId,
            voice,
            media,
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
            mediaCount: entry._count.images,
            processingStatus: calcEntryProcessingStatus(entry.jobs),
            peopleCount: entry._count.people,
            placesCount: entry._count.places
        };
    }
};
