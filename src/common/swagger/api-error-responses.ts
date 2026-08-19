import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { ErrorResponseDto } from '../types/common/error-response.dto';

const DEFAULT_STATUSES = [HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED] as const;

const descriptionMap = new Map<number, string>([
    [400, 'Ошибка валидации / неверный запрос'],
    [401, 'Необходима авторизация'],
    [403, 'Недостаточно прав'],
    [404, 'Ресурс не найден'],
    [409, 'Конфликт данных'],
    [422, 'Ошибка обработки данных'],
    [429, 'Слишком много запросов'],
    [500, 'Внутренняя ошибка сервера']
]);

export function ApiErrorResponses(...statuses: number[]) {
    const list = statuses.length > 0 ? statuses : [...DEFAULT_STATUSES];

    return applyDecorators(
        ...list.map((status) =>
            ApiResponse({
                status,
                description: descriptionMap.get(status) ?? 'Ошибка',
                type: ErrorResponseDto
            })
        )
    );
}
