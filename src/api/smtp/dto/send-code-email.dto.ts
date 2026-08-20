import type { LangEnum } from '../../../common/types/common/lang.enum';

export type SendCodeEmailParams = {
    to: string;
    code: string;
    lang?: LangEnum;
    expiresMinutes?: number;
};
