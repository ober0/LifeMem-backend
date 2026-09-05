import { ModelType } from '@prisma/client';

import type { ModelsSettingsDto } from '../../api/service-settings/dto/settings-json.dto';

type ModelsSettingsLike = Partial<{
    analyze: Partial<{ premium: string | null; lite: string | null }>;
    embedding: Partial<{ premium: string | null; lite: string | null }>;
    vision: Partial<{ premium: string | null; lite: string | null }>;
}>;

export type ModelsSettingsSlot = {
    id: string | null | undefined;
    expectedType: ModelType;
    slot: string;
};

export function getModelsSettingsSlots(models: ModelsSettingsDto): ModelsSettingsSlot[] {
    return [
        { id: models.analyze.premium, expectedType: ModelType.TextToText, slot: 'models.analyze.premium' },
        { id: models.analyze.lite, expectedType: ModelType.TextToText, slot: 'models.analyze.lite' },
        { id: models.embedding.premium, expectedType: ModelType.Embedding, slot: 'models.embedding.premium' },
        { id: models.embedding.lite, expectedType: ModelType.Embedding, slot: 'models.embedding.lite' },
        { id: models.vision.premium, expectedType: ModelType.ImageToText, slot: 'models.vision.premium' },
        { id: models.vision.lite, expectedType: ModelType.ImageToText, slot: 'models.vision.lite' }
    ];
}

function collectModelsSettingsIds(models?: ModelsSettingsLike | null): string[] {
    if (!models) {
        return [];
    }

    return [
        models.analyze?.premium,
        models.analyze?.lite,
        models.embedding?.premium,
        models.embedding?.lite,
        models.vision?.premium,
        models.vision?.lite
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function collectUniqueModelsSettingsIds(models?: ModelsSettingsLike | null): string[] {
    return [...new Set(collectModelsSettingsIds(models))];
}
