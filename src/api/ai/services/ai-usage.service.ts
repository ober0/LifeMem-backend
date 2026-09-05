import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { appConstants } from '../../../common/config/app.constants';
import { AiProvider } from '../../../common/types/ai/ai-provider.enum';
import type { AiTokenUsage } from '../ai.types';

@Injectable()
export class AiUsageService implements OnModuleInit {
    private usdRateInRub: number = 80;

    async onModuleInit(): Promise<void> {
        await this.refreshUsdRate();

        setInterval(async () => {
            await this.refreshUsdRate();
        }, appConstants.ai.refreshUsdMs);
    }

    extractUsage(message: BaseMessage, provider: AiProvider): AiTokenUsage {
        const usage = message instanceof AIMessage ? message : undefined;

        let rubCost: number | undefined = undefined;

        const metadataUsage = usage?.response_metadata.usage as { cost?: number; cost_rub?: number };

        if (typeof metadataUsage?.cost === 'number') {
            switch (provider) {
                case AiProvider.Openrouter:
                    rubCost = metadataUsage.cost * this.usdRateInRub;
                    break;
                case AiProvider.Polza:
                    rubCost = metadataUsage.cost_rub || metadataUsage.cost;
                    break;
            }
        }

        return {
            inputTokens: usage?.usage_metadata?.input_tokens ?? 0,
            outputTokens: usage?.usage_metadata?.output_tokens ?? 0,
            totalTokens: usage?.usage_metadata?.total_tokens ?? 0,
            price: rubCost,
            provider
        };
    }

    extractEmbeddingUsage(
        data: { inputTokens: number; totalTokens: number; cost?: number; costRub?: number },
        provider: AiProvider
    ): AiTokenUsage {
        let rubCost: number | undefined = undefined;

        if (typeof data.cost === 'number') {
            switch (provider) {
                case AiProvider.Openrouter:
                    rubCost = data.cost * this.usdRateInRub;
                    break;
                case AiProvider.Polza:
                    rubCost = data.costRub || data.cost;
                    break;
            }
        }

        return {
            inputTokens: data.inputTokens,
            outputTokens: 0,
            totalTokens: data.totalTokens,
            price: rubCost,
            provider
        };
    }

    mergeUsage(left: AiTokenUsage, right: AiTokenUsage): AiTokenUsage {
        let price: number | undefined = undefined;

        if (right.price) {
            price = (left.price ?? 0) + right.price;
        }

        return {
            inputTokens: left.inputTokens + right.inputTokens,
            outputTokens: left.outputTokens + right.outputTokens,
            totalTokens: left.totalTokens + right.totalTokens,
            price,
            provider: right.provider ?? left.provider ?? undefined
        };
    }

    private async refreshUsdRate(): Promise<void> {
        const response = await fetch('https://api.frankfurter.dev/v2/rate/USD/RUB');
        const { rate } = await response.json();

        if (typeof rate !== 'number' || !Number.isFinite(rate)) {
            return;
        }

        this.usdRateInRub = rate;
    }
}
