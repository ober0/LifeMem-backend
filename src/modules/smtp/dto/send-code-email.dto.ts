import { LangEnum } from '../../../common/types/lang.enum';

export type SendCodeEmailParams = {
    to: string;
    code: string;
    lang?: LangEnum;
    expiresMinutes?: number;
};
