import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { LangEnum } from '../../common/types/common/lang.enum';
import { AiService } from '../ai/ai.service';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { S3Service } from '../s3/s3.service';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import { entryVisionPrompts } from './consts/prompts.const';
import { EntryVisionRepository } from './entry-vision.repository';

@Injectable()
export class EntryVisionService {
    private readonly logger = new Logger(EntryVisionService.name);

    constructor(
        private readonly s3: S3Service,
        private readonly repository: EntryVisionRepository,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly ai: AiService
    ) {}

    async processEntryVision(data: DelayedJobPayloads[typeof DelayedJob.EntryVision]) {
        const imageEntities = await this.repository.getImages(data.entryId, data.entryVideoIds);

        if (imageEntities.length === 0) {
            this.logger.warn(`skip vision: no images entryId=${data.entryId}`);
            return true;
        }

        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO это надо вытаскивать из тарифа
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const modelId = serviceSettings.models.vision[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const userLang = data.userLang ?? appConstants.language.default;

        for (const imageEntity of imageEntities) {
            const file = await this.s3.getObjectBuffer(imageEntity.file.key).catch(() => null);

            if (!file) {
                this.logger.warn(`skip vision image: s3 miss imageId=${imageEntity.id}`);
                continue;
            }

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

            // TODO добавить metadata (структурированный ответ) для premium и потом semantic search?
            /*
            metadata
              ├── description
              ├── objects[]
              ├── scene
              ├── time
              └── activity
             */
            const { requestId } = await this.ai.invoke({
                modelId,
                reasoning: false,
                input: [
                    new SystemMessage(entryVisionPrompts.describeImage(userLang)),
                    new HumanMessage({
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
                    })
                ]
            });

            const { result, usage, timeMs } = await this.ai.waitResult<string>(requestId);
            const description = result?.trim();

            if (!description) {
                this.logger.warn(`skip vision image: empty LLM result imageId=${imageEntity.id}`);
                continue;
            }

            await Promise.all([
                this.repository.updateAiTranscription(imageEntity.id, description),
                this.repository.updateUsage(data.entryId, DelayedJob.EntryVision, {
                    aiModelId: modelId,
                    usage: {
                        ...usage,
                        timeMs
                    }
                })
            ]);
        }

        return true;
    }
}
