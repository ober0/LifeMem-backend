import { OpenAIEmbeddings } from '@langchain/openai';

export type EmbeddingWithUsage = {
    embedding: number[];
    inputTokens: number;
    totalTokens: number;
    cost?: number;
    costRub?: number;
};

export class OpenAIEmbeddingsWithUsage extends OpenAIEmbeddings {
    async embedQueryWithUsage(text: string): Promise<EmbeddingWithUsage> {
        const input = this.stripNewLines ? text.replace(/\n/g, ' ') : text;

        const response = await this.embeddingWithRetry({
            model: this.model,
            input,
            ...(this.dimensions ? { dimensions: this.dimensions } : {}),
            ...(this.encodingFormat ? { encoding_format: this.encodingFormat } : {})
        });

        const embedding = response.data[0]?.embedding;
        if (!Array.isArray(embedding) || embedding.some((value) => typeof value !== 'number')) {
            throw new Error('Invalid embedding response');
        }

        const usage = response.usage as
            { prompt_tokens?: number; total_tokens?: number; cost?: number; cost_rub?: number } | undefined;

        return {
            embedding,
            inputTokens: usage?.prompt_tokens ?? 0,
            totalTokens: usage?.total_tokens ?? usage?.prompt_tokens ?? 0,
            cost: typeof usage?.cost === 'number' ? usage.cost : undefined,
            costRub: typeof usage?.cost_rub === 'number' ? usage.cost : undefined
        };
    }
}
