import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { DELAYED_QUEUE, type DelayedJobName, type DelayedJobPayloads, ENTRY_QUEUE } from './delayed-worker.constants';

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

    constructor(
        @InjectQueue(DELAYED_QUEUE) private readonly delayedQueue: Queue,
        @InjectQueue(ENTRY_QUEUE) private readonly entryQueue: Queue
    ) {}

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
            queue: 'entry' | 'delayed';
        } = { queue: 'delayed' }
    ) {
        const queue = meta.queue === 'entry' ? this.entryQueue : this.delayedQueue;
        await queue.add(key, data);
    }
}
