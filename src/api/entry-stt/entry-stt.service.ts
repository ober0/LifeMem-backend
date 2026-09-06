import { Injectable, Logger } from '@nestjs/common';

import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker';
import { S3Service } from '../s3/s3.service';
import { SttService } from '../stt/stt.service';
import { EntrySttRepository } from './entry-stt.repository';

@Injectable()
export class EntrySttService {
    private readonly logger = new Logger(EntrySttService.name);

    constructor(
        private readonly s3: S3Service,
        private readonly repository: EntrySttRepository,
        private readonly stt: SttService
    ) {}

    async processEntryStt(data: DelayedJobPayloads[typeof DelayedJob.EntryStt]) {
        const voice = await this.repository.getVoice(data.entryId);

        if (!voice) {
            this.logger.warn(`skip stt: no voice entryId=${data.entryId}`);
            return true;
        }

        const audio = await this.s3.getObjectBuffer(voice.file.key).catch(() => null);

        if (!audio) {
            this.logger.warn(`skip stt: s3 miss entryId=${data.entryId}`);
            return true;
        }

        //TODO доставать тарифф из юзера и передвать в stt.transcribe

        const sttResult = await this.stt.transcribe({
            audio,
            filename: voice.file.filename ?? 'voice.webm',
            mimeType: voice.file.mimeType ?? 'audio/webm'
        });

        if (!sttResult.result) {
            this.logger.warn(`skip stt: empty transcript entryId=${data.entryId}`);
            return true;
        }

        await Promise.all([
            this.repository.updateEntryText(data.entryId, sttResult.result),
            this.repository.updateUsage(data.entryId, DelayedJob.EntryStt, {
                aiModelId: sttResult.modelId,
                usage: sttResult.usage
            })
        ]);

        return true;
    }
}
