import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DEFAULT_ERRORS_LANGUAGE } from '../config/contains';
import { ErrorVariables } from '../errors';
import { loadErrorTranslations } from './translation.loader';

type ErrorItem = {
    code: string;
    field?: string;
    base?: string;
    variables?: ErrorVariables;
};

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

        console.log(request.actor?.requestLang);

        const lang = request.actor?.requestLang ?? DEFAULT_ERRORS_LANGUAGE;
        const rawMessage = this.extractMessage(exception);

        const payload = {
            timestamp: Date.now(),
            path: request.originalUrl || request.url,
            errors: rawMessage.map((el) => {
                if (typeof el === 'string') {
                    const isRealKey = this.isRealKey(el);
                    const code = isRealKey ? el : 'common.unknown';
                    const msg = isRealKey ? this.translate(code, lang, el) : el;

                    return {
                        code,
                        message: msg
                    };
                }

                const isRealKey = this.isRealKey(el.code);
                const code = isRealKey ? el.code : 'common.unknown';
                const msg = this.translate(code, lang, el.base ?? 'Unknown error', {
                    ...el.variables,
                    ...(el.field ? { field: el.field } : {})
                });

                return {
                    code,
                    message: msg,
                    ...(el.base ? { meta: el.base } : {})
                };
            })
        };

        response.status(status).json(payload);
    }

    private isRealKey(el: string): boolean {
        return el in this.translations;
    }

    private translate(code: string, lang: string, fallback: string, variables: ErrorVariables = {}): string {
        const entry = this.translations[code];

        if (!entry?.[lang]) {
            return fallback;
        }

        let text = entry[lang];

        for (const [name, value] of Object.entries(variables)) {
            text = text.replaceAll(`{{${name}}}`, String(value));
        }

        return text;
    }

    private extractMessage(exception: unknown): (string | ErrorItem)[] {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return [response];
            }
            if (typeof response === 'object' && response !== null) {
                if ('errors' in response && Array.isArray(response.errors) && response.errors.length > 0) {
                    return response.errors;
                }

                if (typeof (response as { code?: unknown }).code === 'string') {
                    return [
                        {
                            code: (response as { code: string }).code,
                            variables:
                                'variables' in response &&
                                typeof response.variables === 'object' &&
                                response.variables !== null
                                    ? (response.variables as ErrorVariables)
                                    : undefined
                        }
                    ];
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
            Logger.error(exception);
            return ['common.unknown'];
        }

        return ['common.unknown'];
    }
}
