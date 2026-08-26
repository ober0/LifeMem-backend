import { Injectable, Logger } from '@nestjs/common';

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

    schedule(taskId: string, delayMs: number, action: () => void) {
        const timeout = setTimeout(() => {
            action();
            this.tasks.delete(taskId);
        }, delayMs);

        this.tasks.set(taskId, timeout);
    }

    setImmediate(fn: () => Promise<any> | any): void {
        setImmediate(() => {
            Promise.resolve()
                .then(fn)
                .catch((err) => {
                    Logger.fatal(formatError(err));
                });
        });
    }
}
