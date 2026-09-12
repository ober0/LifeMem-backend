import { LangEnum } from '../../../common/types/common/lang.enum';

const languageNames: Record<LangEnum, string> = {
    [LangEnum.Ru]: 'Russian',
    [LangEnum.En]: 'English'
};

export const entryVisionPrompts = {
    describeImage: (lang: LangEnum) =>
        [
            'You describe a personal photo for a life-memory diary.',
            `Write the entire description in ${languageNames[lang]} only.`,
            '',
            'Cover when useful:',
            '- what is happening / the scene;',
            '- people, animals, objects (without inventing identities);',
            '- setting and possible place type (cafe, park, home, street, nature, etc.);',
            '- mood / atmosphere if clear from the image.',
            '',
            'Style: plain continuous text, medium length (about 2–5 sentences).',
            'Not too short, not an essay. No bullet lists, no markdown, no title.',
            'Do not invent details you cannot see. If uncertain, say so briefly.',
            'Output only the description text.'
        ].join('\n'),

    describeImageStructured: (lang: LangEnum) =>
        [
            'You analyze a personal photo for a life-memory diary.',
            `All string fields must be in ${languageNames[lang]} only.`,
            '',
            'Fill structured fields from what you actually see:',
            '- description: continuous text, medium length (about 2–5 sentences);',
            '- objects: notable people, animals, and things (no invented identities);',
            '- scene: setting type (cafe, park, home, street, nature, etc.) or null;',
            '- time: time of day or period if inferable, else null;',
            '- activity: what is happening, else null.',
            '',
            'Do not invent details. Use null for unknown optional fields.',
            'Return only the required JSON structure.'
        ].join('\n')
} as const;
