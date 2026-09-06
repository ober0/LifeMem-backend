import { ModelType } from '@prisma/client';

import type { ModelsSettingsDto } from '../../api/service-settings/dto/settings-json.dto';

type ModelsSettingsLike = Partial<{
    analyze: Partial<{ premium: string | null; lite: string | null }>;
    vision: Partial<{ premium: string | null; lite: string | null }>;
    stt: Partial<{ premium: string | null; lite: string | null }>;
    sttRefine: Partial<{ premium: string | null; lite: string | null }>;
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
        { id: models.vision.premium, expectedType: ModelType.ImageToText, slot: 'models.vision.premium' },
        { id: models.vision.lite, expectedType: ModelType.ImageToText, slot: 'models.vision.lite' },
        { id: models.stt.premium, expectedType: ModelType.SpeechToText, slot: 'models.stt.premium' },
        { id: models.stt.lite, expectedType: ModelType.SpeechToText, slot: 'models.stt.lite' },
        { id: models.sttRefine.premium, expectedType: ModelType.TextToText, slot: 'models.sttRefine.premium' },
        { id: models.sttRefine.lite, expectedType: ModelType.TextToText, slot: 'models.sttRefine.lite' }
    ];
}

function collectModelsSettingsIds(models?: ModelsSettingsLike | null): string[] {
    if (!models) {
        return [];
    }

    return [
        models.analyze?.premium,
        models.analyze?.lite,
        models.vision?.premium,
        models.vision?.lite,
        models.stt?.premium,
        models.stt?.lite,
        models.sttRefine?.premium,
        models.sttRefine?.lite
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function collectUniqueModelsSettingsIds(models?: ModelsSettingsLike | null): string[] {
    return [...new Set(collectModelsSettingsIds(models))];
}
