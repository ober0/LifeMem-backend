import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { loadTranslations } from './translation.loader';

type RequestUser = {
    id?: string;
    language?: string;
};

@Injectable()
@Catch()
export class TranslateFilter implements ExceptionFilter {
    private readonly translations = loadTranslations();

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request & { user?: RequestUser }>();

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();
            if (Array.isArray(exceptionResponse)) {
                response.status(status).json(exceptionResponse);
                return;
            }
        }

        const userLang = request.user?.language;
        const headerLang = request.headers['accept-language'] as string | undefined;
        const lang = userLang?.toLowerCase() ?? headerLang ?? 'en';

        const rawMessage = this.extractMessage(exception);

        const normalizedLang = lang.toLowerCase();

        const code = typeof rawMessage === 'string' ? rawMessage : 'error.common.unknown';
        const msg = this.translate(code, normalizedLang, rawMessage);

        const payload = {
            timestamp: Date.now(),
            path: request.originalUrl || request.url,
            code,
            msg
        };

        response.status(status).json(payload);
    }

    private translate(code: string, lang: string, fallback: string | object) {
        if (!code.startsWith('error.') || Array.isArray(fallback)) {
            return fallback;
        }
        const entry = this.translations[code];

        return entry?.[lang] ?? entry?.['en'] ?? 'Internal translation error';
    }

    private extractMessage(exception: unknown): string | string[] {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return response;
            }
            if (typeof response === 'object' && response !== null) {
                if (typeof (response as { code?: unknown }).code === 'string') {
                    return (response as { code: string }).code;
                }

                const message = (response as { message?: unknown }).message;
                if (typeof message === 'string') {
                    return message;
                }
                if (Array.isArray(message) && message.length > 0) {
                    return message;
                }
            }
        }

        if (typeof exception === 'string') {
            return exception;
        }

        if (exception instanceof Error) {
            return exception.message;
        }

        return 'error.common.unknown';
    }
}
