import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { assertNotAborted } from '../../common/helpers/job-abort';
import { LangEnum } from '../../common/types/common/lang.enum';
import type { EntryJobExecutionOptions } from '../../common/types/entry-job-execution';
import { AiService } from '../ai/ai.service';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { S3Service } from '../s3/s3.service';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import { entryVisionPrompts } from './consts/prompts.const';
import { EntryVisionRepository } from './entry-vision.repository';
import {
    type EntryImageVisionMetadata,
    entryImageVisionMetadataFormatInstructions,
    entryImageVisionMetadataParser
} from './entry-vision.types';

@Injectable()
export class EntryVisionService {
    private readonly logger = new Logger(EntryVisionService.name);

    constructor(
        private readonly s3: S3Service,
        private readonly repository: EntryVisionRepository,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly ai: AiService
    ) {}

    async processEntryVision(
        data: DelayedJobPayloads[typeof DelayedJob.EntryVision],
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const imageEntities = await this.repository.getImages(data.entryId, data.entryVideoIds);

        if (imageEntities.length === 0) {
            this.logger.warn(`skip vision: no images entryId=${data.entryId}`);
            return true;
        }

        assertNotAborted(options?.signal);

        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO это надо вытаскивать из тарифа
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const modelId = serviceSettings.models.vision[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const userLang = data.userLang ?? appConstants.language.default;

        for (const imageEntity of imageEntities) {
            assertNotAborted(options?.signal);

            const file = await this.s3.getObjectBuffer(imageEntity.file.key).catch(() => null);

            if (!file) {
                this.logger.warn(`skip vision image: s3 miss imageId=${imageEntity.id}`);
                continue;
            }

            assertNotAborted(options?.signal);

            const resized = await sharp(file)
                .resize({
                    width: 1600,
                    height: 1600,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: 80
                })
                .toBuffer();

            const imageHumanMessage = new HumanMessage({
                content: [
                    {
                        type: 'text',
                        text:
                            userLang === LangEnum.Ru
                                ? 'Опиши это фото на русском языке.'
                                : 'Describe this photo in english language.'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${resized.toString('base64')}`
                        }
                    }
                ]
            });

            assertNotAborted(options?.signal);
            if (tariff === 'premium') {
                await this.processPremiumImage({
                    imageId: imageEntity.id,
                    jobId: data.jobId,
                    modelId,
                    userLang,
                    imageHumanMessage,
                    signal: options?.signal
                });
            } else {
                await this.processLiteImage({
                    imageId: imageEntity.id,
                    jobId: data.jobId,
                    modelId,
                    userLang,
                    imageHumanMessage,
                    signal: options?.signal
                });
            }
        }

        return true;
    }

    private async processLiteImage(params: {
        imageId: string;
        jobId: string;
        modelId: string;
        userLang: LangEnum;
        imageHumanMessage: HumanMessage;
        signal?: AbortSignal;
    }) {
        const { requestId } = await this.ai.invoke({
            modelId: params.modelId,
            reasoning: false,
            input: [new SystemMessage(entryVisionPrompts.describeImage(params.userLang)), params.imageHumanMessage]
        });

        const { result, usage, timeMs } = await this.ai.waitResult<string>(requestId, { signal: params.signal });
        const description = result?.trim();

        if (!description) {
            this.logger.warn(`skip vision image: empty LLM result imageId=${params.imageId}`);
            return;
        }

        assertNotAborted(params.signal);

        await this.persistVisionResult({
            imageId: params.imageId,
            jobId: params.jobId,
            modelId: params.modelId,
            aiTranscription: description,
            aiMetadata: null,
            usage,
            timeMs
        });
    }

    private async processPremiumImage(params: {
        imageId: string;
        jobId: string;
        modelId: string;
        userLang: LangEnum;
        imageHumanMessage: HumanMessage;
        signal?: AbortSignal;
    }) {
        const { requestId } = await this.ai.invoke({
            modelId: params.modelId,
            reasoning: false,
            parser: entryImageVisionMetadataParser,
            instruction: entryImageVisionMetadataFormatInstructions,
            input: [
                new SystemMessage(entryVisionPrompts.describeImageStructured(params.userLang)),
                params.imageHumanMessage
            ]
        });

        const { result, usage, timeMs } = await this.ai.waitResult<EntryImageVisionMetadata>(requestId, {
            signal: params.signal
        });
        const description = result?.description?.trim();

        if (!description) {
            this.logger.warn(`skip vision image: empty LLM metadata description imageId=${params.imageId}`);
            return;
        }

        assertNotAborted(params.signal);

        await this.persistVisionResult({
            imageId: params.imageId,
            jobId: params.jobId,
            modelId: params.modelId,
            aiTranscription: description,
            aiMetadata: result,
            usage,
            timeMs
        });
    }

    private async persistVisionResult(params: {
        imageId: string;
        jobId: string;
        modelId: string;
        aiTranscription: string;
        aiMetadata: EntryImageVisionMetadata | null;
        usage: AiTokenUsage;
        timeMs?: number;
    }) {
        await Promise.all([
            this.repository.updateVisionResult(params.imageId, {
                aiTranscription: params.aiTranscription,
                aiMetadata: params.aiMetadata
            }),
            this.repository.updateUsage(params.jobId, {
                aiModelId: params.modelId,
                usage: {
                    ...params.usage,
                    timeMs: params.timeMs
                }
            })
        ]);
    }
}
