import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';
import sharp from 'sharp';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { assertNotAborted } from '../../common/helpers/job-abort';
import { LangEnum } from '../../common/types/common/lang.enum';
import type { EntryJobExecutionOptions } from '../../common/types/entry-job-execution';
import { AiService } from '../ai/ai.service';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
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
        private readonly ai: AiService,
        private readonly ffmpeg: FfmpegService
    ) {}

    async processEntryVision(
        data: DelayedJobPayloads[typeof DelayedJob.EntryVision],
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const mediaEntities = await this.repository.getMedia(data.entryId, data.entryMediaIds);

        if (mediaEntities.length === 0) {
            this.logger.warn(`skip vision: no media entryId=${data.entryId}`);
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

        for (const mediaEntity of mediaEntities) {
            assertNotAborted(options?.signal);

            const file = await this.s3.getObjectBuffer(mediaEntity.file.key).catch(() => null);

            if (!file) {
                this.logger.warn(`skip vision image: s3 miss mediaId=${mediaEntity.id}`);
                continue;
            }

            const files: Buffer[] = [];

            assertNotAborted(options?.signal);

            if (mediaEntity.type === FileType.IMAGE) {
                files.push(file);
            } else if (mediaEntity.type === FileType.VIDEO) {
                // FIXME сделать норм получение из настроек тарифа
                let framesCount: number = 3;
                if (tariff === 'premium') {
                    framesCount = 5;
                }

                try {
                    const frames = await this.ffmpeg.extractFrames(file, framesCount);
                    files.push(...frames);
                } catch (error) {
                    this.logger.warn(
                        `skip vision video: extract frames failed mediaId=${mediaEntity.id} error=${
                            error instanceof Error ? error.message : String(error)
                        }`
                    );
                    continue;
                }

                if (files.length === 0) {
                    this.logger.warn(`skip vision video: no frames mediaId=${mediaEntity.id}`);
                    continue;
                }
            } else {
                continue;
            }

            const resizedFiles = await Promise.all(
                files.map(async (el) => {
                    return sharp(el)
                        .resize({
                            width: 920,
                            height: 920,
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                        .jpeg({
                            quality: 80
                        })
                        .toBuffer();
                })
            );

            const isImage = mediaEntity.type === FileType.IMAGE;

            const imageHumanMessage = new HumanMessage({
                content: [
                    {
                        type: 'text',
                        text:
                            userLang === LangEnum.Ru
                                ? `Опиши это ${isImage ? 'фото' : 'видео, разбитое на фреймы'} на русском языке.`
                                : `Describe this ${isImage ? 'photo' : 'video, sliced on frames'} in english language.`
                    },
                    ...resizedFiles.map((frame) => {
                        return {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${frame.toString('base64')}`
                            }
                        };
                    })
                ]
            });

            assertNotAborted(options?.signal);
            if (tariff === 'premium') {
                await this.processPremiumImage({
                    mediaId: mediaEntity.id,
                    jobId: data.jobId,
                    modelId,
                    userLang,
                    imageHumanMessage,
                    signal: options?.signal
                });
            } else {
                await this.processLiteImage({
                    mediaId: mediaEntity.id,
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
        mediaId: string;
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
            this.logger.warn(`skip vision image: empty LLM result mediaId=${params.mediaId}`);
            return;
        }

        assertNotAborted(params.signal);

        await this.persistVisionResult({
            mediaId: params.mediaId,
            jobId: params.jobId,
            modelId: params.modelId,
            aiTranscription: description,
            aiMetadata: null,
            usage,
            timeMs
        });
    }

    private async processPremiumImage(params: {
        mediaId: string;
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
            this.logger.warn(`skip vision image: empty LLM metadata description mediaId=${params.mediaId}`);
            return;
        }

        assertNotAborted(params.signal);

        await this.persistVisionResult({
            mediaId: params.mediaId,
            jobId: params.jobId,
            modelId: params.modelId,
            aiTranscription: description,
            aiMetadata: result,
            usage,
            timeMs
        });
    }

    private async persistVisionResult(params: {
        mediaId: string;
        jobId: string;
        modelId: string;
        aiTranscription: string;
        aiMetadata: EntryImageVisionMetadata | null;
        usage: AiTokenUsage;
        timeMs?: number;
    }) {
        await Promise.all([
            this.repository.updateVisionResult(params.mediaId, {
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
