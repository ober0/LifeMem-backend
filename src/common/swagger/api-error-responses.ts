import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

const DEFAULT_STATUSES = [HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED] as const;

export function ApiErrorResponses(...statuses: number[]) {
    const list = statuses.length > 0 ? statuses : [...DEFAULT_STATUSES];

    return applyDecorators(
        ...list.map((status) =>
            ApiResponse({
                status,
                type: ErrorResponseDto
            })
        )
    );
}
