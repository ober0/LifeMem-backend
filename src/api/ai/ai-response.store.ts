import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import type { AiInvokeResult, AiRequestLookupResult, AiTokenUsage } from './ai.types';

type AiStoredResponse =
    | {
          status: 'pending';
          expiresAt: number;
      }
    | {
          status: 'ready';
          expiresAt: number;
          result: unknown;
          timeMs: number;
          usage: AiTokenUsage;
      }
    | {
          status: 'failed';
          expiresAt: number;
          error: string;
      };

@Injectable()
export class AiResponseStore {
    private readonly logger = new Logger(AiResponseStore.name);
    private readonly responses = new Map<string, AiStoredResponse>();

    createPending(requestId: string): void {
        this.responses.set(requestId, {
            status: 'pending',
            expiresAt: Date.now() + appConstants.ai.responseTtlMs
        });
    }

    setReady(requestId: string, payload: AiInvokeResult<unknown> & { timeMs: number }): void {
        if (!this.responses.has(requestId)) {
            return;
        }

        this.responses.set(requestId, {
            status: 'ready',
            expiresAt: Date.now() + appConstants.ai.responseTtlMs,
            result: payload.result,
            timeMs: payload.timeMs,
            usage: payload.usage
        });
    }

    setFailed(requestId: string, error: string): void {
        if (!this.responses.has(requestId)) {
            return;
        }

        this.responses.set(requestId, {
            status: 'failed',
            expiresAt: Date.now() + appConstants.ai.responseTtlMs,
            error
        });
    }

    take<T>(requestId: string): AiRequestLookupResult<T> {
        const entry = this.responses.get(requestId);

        if (!entry || entry.expiresAt <= Date.now()) {
            this.responses.delete(requestId);
            throw apiError.notFound('ai.request_not_found');
        }

        if (entry.status === 'pending') {
            return { status: 'pending' };
        }

        this.responses.delete(requestId);

        if (entry.status === 'failed') {
            return {
                status: 'failed',
                error: entry.error
            };
        }

        return {
            status: 'ready',
            result: entry.result as T,
            timeMs: entry.timeMs,
            usage: entry.usage
        };
    }

    @Interval(appConstants.ai.responseCleanupIntervalMs)
    cleanupExpired(): void {
        const now = Date.now();
        let removed = 0;

        for (const [requestId, entry] of this.responses) {
            if (entry.expiresAt <= now) {
                this.responses.delete(requestId);
                removed += 1;
            }
        }

        if (removed > 0) {
            this.logger.debug(`AI response store cleanup removed=${removed}`);
        }
    }
}
