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
        ].join('\n')
} as const;
