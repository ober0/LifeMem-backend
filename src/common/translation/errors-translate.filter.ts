import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { loadErrorTranslations } from './translation.loader';
import { LangEnum } from '../types/lang.enum';
import { DEFAULT_ERRORS_LANGUAGE } from '../config/contains';

@Catch()
export class ErrorsTranslateFilter implements ExceptionFilter {
    private readonly translations = loadErrorTranslations();

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();

            if (Array.isArray(exceptionResponse)) {
                response.status(status).json(exceptionResponse);
                return;
            }
        }

        const userLang = request.actor?.settings?.lang;
        let headerLang = request.headers['x-accept-language'] as LangEnum | undefined;

        if (!Object.values(LangEnum).includes(headerLang as LangEnum)) {
            headerLang = undefined;
        }

        const lang = (userLang ?? headerLang ?? DEFAULT_ERRORS_LANGUAGE).toLowerCase();

        const rawMessage = this.extractMessage(exception);

        const payload = {
            timestamp: Date.now(),
            path: request.originalUrl || request.url,
            errors: rawMessage.map((el) => {
                if (typeof el === 'string') {
                    const isRealKey = this.isRealKey(el);
                    const code = isRealKey ? el : 'error.common.unknown';
                    const msg = isRealKey ? this.translate(code, lang, el) : el;

                    return {
                        code,
                        message: msg
                    };
                } else if ('field' in el && 'code' in el) {
                    const isRealKey = this.isRealKey(el.code);
                    const code = el.code;
                    const msg = isRealKey
                        ? this.translate(code, lang, el, [{ name: 'field', value: el.field }])
                        : el.base;

                    return {
                        code,
                        message: msg,
                        meta: el.base
                    };
                } else {
                    return {
                        code: 'error.common.unknown',
                        message: 'Unknown error'
                    };
                }
            })
        };

        response.status(status).json(payload);
    }

    private isRealKey(el: string): boolean {
        return el in this.translations;
    }

    private translate(
        code: string,
        lang: string,
        fallback: string | object,
        variables: { name: string; value: string }[] = []
    ) {
        if (!code.startsWith('error.') || Array.isArray(fallback)) {
            return fallback;
        }
        const entry = this.translations[code];

        if (!entry?.[lang]) {
            return typeof fallback === 'string' ? fallback : 'Unknown error';
        }

        let text = entry[lang];

        if (variables.length > 0) {
            variables.forEach((variable) => {
                text = text.replace(`{{${variable.name}}}`, variable.value);
            });
        }

        return text;
    }

    private extractMessage(exception: unknown): string[] | { field: string; code: string }[] {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return [response];
            }
            if (typeof response === 'object' && response !== null) {
                if ('errors' in response && Array.isArray(response.errors) && response.errors?.length > 0) {
                    return response.errors;
                }

                if (typeof (response as { code?: unknown }).code === 'string') {
                    return [(response as { code: string }).code];
                }

                const message = (response as { message?: unknown }).message;
                if (typeof message === 'string') {
                    return [message];
                }

                if (Array.isArray(message) && message.length > 0) {
                    return message;
                }
            }
        }

        if (typeof exception === 'string') {
            return [exception];
        }

        if (exception instanceof Error) {
            return [exception.message];
        }

        return ['error.common.unknown'];
    }
}
