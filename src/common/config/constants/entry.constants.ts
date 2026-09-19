import { FileType } from '@prisma/client';

export const entryConstants = {
    maxMediaPerEntry: 5,
    maxPlacesPerEntry: 3,
    mediaUrlLifeTime: 60 * 60, // в секундах (1 час)
    allowedMediaFileTypes: [FileType.IMAGE, FileType.VIDEO] as const,
    allowedAudioFileTypes: [FileType.AUDIO] as const,
    search: {
        // насколько далеко по смыслу (косинус) ещё ок - чем больше, тем больше заметок вылезет, в т.ч. лишних
        vectorMaxCosineDistance: 0.52,
        // минимальная «похожесть» 0..1 для векторов title/text/image - ниже порога в выдачу не попадает
        vectorMinSimilarity: 0.48,
        // короче этого query - только like по текстам, embed и векторы не трогаем (1 символ = шум)
        minQueryLengthForVector: 2,

        // ПОКА НЕ АКТИВНО

        // нашли подстроку в заголовке - самый высокий приоритет в сортировке
        scoreTitleLike: 0.8,
        // нашли в тексте заметки - чуть ниже title
        scoreTextLike: 0.75,
        // нашли в описании фото или в ai-расшифровке - ниже, чем body
        scoreMediaLike: 0.7
    }
} as const;
