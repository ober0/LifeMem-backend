import { Injectable, Logger } from '@nestjs/common';

import { BullMqQueue, type BullMqQueueName } from '../bullmq/bullmq.constants';
import { BullMqService } from '../bullmq/bullmq.service';
import type { DelayedJobName, DelayedJobPayloads } from './delayed-worker.types';

const formatError = (err: unknown) => {
    if (err instanceof Error) {
        return `${err.name}: ${err.message}\n${err.stack}`;
    }

    try {
        return JSON.stringify(err, null, 2);
    } catch {
        return String(err);
    }
};

@Injectable()
export class DelayedWorkerService {
    private tasks: Map<string, NodeJS.Timeout> = new Map();

    constructor(private readonly bullMq: BullMqService) {}

    schedule(taskId: string, delayMs: number, action: () => void) {
        const timeout = setTimeout(() => {
            action();
            this.tasks.delete(taskId);
        }, delayMs);

        this.tasks.set(taskId, timeout);
    }

    setImmediate(fn: () => Promise<unknown> | unknown): void {
        setImmediate(() => {
            Promise.resolve()
                .then(fn)
                .catch((err) => {
                    Logger.fatal(formatError(err));
                });
        });
    }

    async delayed<K extends DelayedJobName>(
        key: K,
        data: DelayedJobPayloads[K],
        meta: {
            queue: Exclude<BullMqQueueName, typeof BullMqQueue.LocalEmbedding>;
        } = { queue: BullMqQueue.Delayed }
    ) {
        await this.bullMq.add(meta.queue, key, data);
    }
}
