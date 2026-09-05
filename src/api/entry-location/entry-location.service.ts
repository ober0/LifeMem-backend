import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Injectable, Logger } from '@nestjs/common';
import { EntryVectorKind } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { LangEnum } from '../../common/types/common/lang.enum';
import { AiService } from '../ai/ai.service';
import type { AiInvokeResult } from '../ai/ai.types';
import { AiToolKey } from '../ai/tools/ai-tool-key.enum';
import {
    DelayedJob,
    type DelayedJobPayloads,
    type EntryLocationCoordPayload
} from '../delayed-worker/delayed-worker.constants';
import { OpenstreetmapService } from '../openstreetmap/openstreetmap.service';
import { OpenstreetReverseResponse } from '../openstreetmap/types';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import { entryLocationPrompts } from './consts/prompts.const';
import { EntryLocationRepository } from './entry-location.repository';
import {
    CreateLocationDto,
    DetectedPersonResult,
    DetectedPlaceResult,
    detectPeoplePlacesFormatInstructions,
    detectPeoplePlacesParser,
    DetectPeoplePlacesResult
} from './types';

@Injectable()
export class EntryLocationService {
    private readonly logger = new Logger(EntryLocationService.name);

    constructor(
        private readonly repository: EntryLocationRepository,
        private readonly openstreetmap: OpenstreetmapService,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly ai: AiService
    ) {}

    async processEntryLocation(data: DelayedJobPayloads[typeof DelayedJob.EntryLocation]) {
        for (const item of data.locations) {
            await this.processOneLocation(item, data.userId, data.entryId, data.userLang);
        }

        return true;
    }

    private async processOneLocation(
        item: EntryLocationCoordPayload,
        userId: string,
        entryId: string,
        userLang?: LangEnum
    ) {
        const location: OpenstreetReverseResponse | null = await this.getLocation({
            latitude: item.latitude,
            longitude: item.longitude,
            label: item.locationLabel,
            userLang: userLang
        });

        if (!location && !item.locationLabel) {
            throw apiError.internal('entry.location_required');
        }

        const createData: CreateLocationDto = {
            ...location,
            latitude: item.latitude,
            longitude: item.longitude,
            shortName: item.locationLabel ?? location?.shortName ?? ''
        };

        this.logger.log(`creating place for entryId=${entryId} lat=${item.latitude} lng=${item.longitude}`);
        await this.repository.createLocation(createData, userId, entryId);
    }

    private async getLocation(data: {
        latitude: number;
        longitude: number;
        label: string | undefined;
        userLang: LangEnum | undefined;
    }) {
        const userName = data.label;

        const openstreetData = await this.openstreetmap.getNearestLocName(data.latitude, data.longitude, data.userLang);

        if (!openstreetData) {
            return null;
        }

        return {
            ...openstreetData,
            shortName: userName ?? openstreetData?.shortName
        };
    }

    async processEntryLocationAndPeopleDetect(
        data: DelayedJobPayloads[typeof DelayedJob.EntryLocationAndPeopleDetect]
    ) {
        const entry = await this.repository.getEntryText(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const text = entry.text?.trim();
        if (!text) {
            this.logger.warn(`skip detect: empty text entryId=${data.entryId}`);
            return true;
        }

        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO это надо вытаскивать из тарифа
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const modelId = serviceSettings.models.analyze[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const { requestId } = await this.ai.invokeWithTools({
            modelId,
            maxSteps: appConstants.ai.defaultMaxToolSteps,
            tools: [AiToolKey.SearchPeople, AiToolKey.SearchPlaces],
            toolContext: { userId: data.userId },
            parser: detectPeoplePlacesParser,
            instruction: detectPeoplePlacesFormatInstructions,
            reasoning: false,
            input: [
                new SystemMessage(entryLocationPrompts.peoplePlacesDetect),
                new SystemMessage(entryLocationPrompts.parallelToolSearch),
                new HumanMessage(text)
            ]
        });

        const { result, usage, timeMs } = await this.waitAiResult<DetectPeoplePlacesResult>(requestId);

        await Promise.all([
            this.applyDetectedPeople(data.userId, data.entryId, result.people ?? []),
            this.applyDetectedPlaces(data.userId, data.entryId, result.places ?? []),
            this.repository.updateUsage(data.entryId, DelayedJob.EntryLocationAndPeopleDetect, {
                aiModelId: modelId,
                usage: {
                    ...usage,
                    timeMs
                }
            })
        ]);

        return true;
    }

    private waitAiResult<T>(requestId: string): Promise<AiInvokeResult<T>> {
        const timeoutMs = appConstants.ai.resultWaitTimeoutSec * 1000;
        const startedAt = Date.now();

        return new Promise<AiInvokeResult<T>>((resolve, reject) => {
            const timer = setInterval(() => {
                try {
                    if (Date.now() - startedAt >= timeoutMs) {
                        clearInterval(timer);
                        reject(apiError.internal('ai.request_timeout'));
                        return;
                    }

                    const lookup = this.ai.getResult<T>(requestId);

                    if (lookup.status === 'pending') {
                        return;
                    }

                    clearInterval(timer);

                    if (lookup.status === 'failed') {
                        reject(apiError.internal('ai.request_failed', { error: lookup.error }));
                        return;
                    }

                    resolve({
                        result: lookup.result,
                        usage: lookup.usage,
                        timeMs: lookup.timeMs
                    });
                } catch (error) {
                    clearInterval(timer);
                    reject(error);
                }
            }, appConstants.ai.resultPollIntervalMs);
        });
    }

    private async applyDetectedPeople(userId: string, entryId: string, people: DetectedPersonResult[]) {
        const peoples = new Set<string>();

        for (const item of people) {
            const name = item.name?.trim();
            if (!name) {
                continue;
            }

            const key = name.toLowerCase();
            if (peoples.has(key)) {
                continue;
            }
            peoples.add(key);

            if (item.exists && item.id) {
                const owned = await this.repository.findPersonOwned(userId, item.id);
                if (owned) {
                    await this.repository.attachPerson(entryId, owned.id);
                    continue;
                }
            }

            await this.repository.connectOrCreatePerson(userId, entryId, name, true);
        }
    }

    private async applyDetectedPlaces(userId: string, entryId: string, places: DetectedPlaceResult[]) {
        const placesSet = new Set<string>();

        for (const item of places) {
            const name = item.name?.trim();
            if (!name) {
                continue;
            }

            const key = name.toLowerCase();
            if (placesSet.has(key)) {
                continue;
            }
            placesSet.add(key);

            if (item.exists && item.id) {
                const owned = await this.repository.findPlaceOwned(userId, item.id);
                if (owned) {
                    await this.repository.attachPlace(entryId, owned.id);
                    continue;
                }
            }

            await this.repository.connectOrCreatePlace(userId, entryId, {
                name,
                latitude: null,
                longitude: null,
                autodetected: true
            });
        }
    }

    async processEntryEmbedTitle(data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedTitle]) {
        const entry = await this.repository.getEntryTitle(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const title = entry.title?.trim();
        if (!title) {
            this.logger.warn(`skip embed title: empty title entryId=${data.entryId}`);
            return true;
        }

        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO это надо вытаскивать из тарифа
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const modelId = serviceSettings.models.embedding[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const { requestId } = await this.ai.embed({
            modelId,
            text: title
        });

        const { result, usage, timeMs } = await this.waitAiResult<number[]>(requestId);

        await Promise.all([
            this.repository.updateUsage(data.entryId, DelayedJob.EntryEmbedTitle, {
                aiModelId: modelId,
                usage: {
                    ...usage,
                    timeMs
                }
            }),
            this.createEntryVector({
                entryId: entry.id,
                kind: EntryVectorKind.Title,
                aiModelId: modelId,
                embedding: result,
                dimensions: result.length
            })
        ]);

        return true;
    }

    private async createEntryVector(data: {
        entryId: string;
        kind: EntryVectorKind;
        aiModelId: string;
        embedding: number[];
        dimensions?: number;
        imageId?: string | null;
        id?: string;
    }) {
        if (data.embedding.length === 0 || data.embedding.some((value) => !Number.isFinite(value))) {
            throw apiError.badRequest('entry.invalid_embedding');
        }

        const dimensions = data.dimensions ?? data.embedding.length;
        if (dimensions !== data.embedding.length) {
            throw apiError.badRequest('entry.invalid_embedding_dimensions');
        }

        return this.repository.createEntryVector(data);
    }

    async processEntryEmbedText(data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedTitle]) {
        const entry = await this.repository.getEntryText(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const text = entry.text?.trim();
        if (!text) {
            this.logger.warn(`skip embed title: empty text entryId=${data.entryId}`);
            return true;
        }

        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO это надо вытаскивать из тарифа
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const modelId = serviceSettings.models.embedding[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const { requestId } = await this.ai.embed({
            modelId,
            text: text
        });

        const { result, usage, timeMs } = await this.waitAiResult<number[]>(requestId);

        await Promise.all([
            this.repository.updateUsage(data.entryId, DelayedJob.EntryEmbedText, {
                aiModelId: modelId,
                usage: {
                    ...usage,
                    timeMs
                }
            }),
            this.createEntryVector({
                entryId: entry.id,
                kind: EntryVectorKind.Text,
                aiModelId: modelId,
                embedding: result,
                dimensions: result.length
            })
        ]);

        return true;
    }
}
