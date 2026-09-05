import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { getExecuteTime } from '../../common/helpers/get-execute-time';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import type {
    AiInvokeParams,
    AiInvokeResult,
    AiInvokeWithToolsParams,
    AiRequestAccepted,
    AiRequestLookupResult
} from './ai.types';
import { AiResponseStore } from './ai-response.store';
import { AiInvokeService } from './services/ai-invoke.service';
import { AiModelsService } from './services/ai-models.service';

@Injectable()
export class AiService implements OnModuleInit {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private readonly invokeService: AiInvokeService,
        private readonly models: AiModelsService,
        private readonly responseStore: AiResponseStore,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.models.refreshModels();
    }

    async invoke(params: AiInvokeParams): Promise<AiRequestAccepted> {
        return this.enqueueRequest(() => this.invokeService.execute(params));
    }

    async invokeWithTools(params: AiInvokeWithToolsParams): Promise<AiRequestAccepted> {
        return this.enqueueRequest(() => this.invokeService.executeWithTools(params));
    }

    getResult<T = unknown>(requestId: string): AiRequestLookupResult<T> {
        return this.responseStore.take<T>(requestId);
    }

    async refreshModels(): Promise<void> {
        await this.models.refreshModels();
    }

    async addModels(): Promise<void> {
        await this.models.addModels();
    }

    private enqueueRequest(executor: () => Promise<AiInvokeResult<unknown>>): AiRequestAccepted {
        const requestId = randomUUID();
        this.responseStore.createPending(requestId);

        this.delayedWorker.setImmediate(async () => {
            try {
                const { result: payload, timeMs } = await getExecuteTime(executor);

                this.responseStore.setReady(requestId, {
                    result: payload.result,
                    usage: {
                        ...payload.usage,
                        timeMs
                    },
                    timeMs
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown AI error';
                this.logger.error(`AI request failed requestId=${requestId}: ${message}`);
                this.responseStore.setFailed(requestId, message);
            }
        });

        return { requestId };
    }
}
