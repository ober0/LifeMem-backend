import { registerAs } from '@nestjs/config';

export type AiConfig = {
    openrouterApiKey: string;
    polzaAiApiKey: string;
};

export default registerAs(
    'ai',
    (): AiConfig => ({
        openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
        polzaAiApiKey: process.env.POLZA_AI_API_KEY ?? ''
    })
);
