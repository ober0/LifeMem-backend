import { Request } from 'express';
import { LangEnum } from '../types/lang.enum';

const acceptedValues: string[] = Object.values(LangEnum);

export function getLanguageFromRequest(request: Request): LangEnum {
    const header = request.headers['x-accept-language'];

    if (typeof header !== 'string') {
        return LangEnum.En;
    }

    if (!acceptedValues.includes(header)) {
        return LangEnum.En;
    }

    return header as LangEnum;
}
