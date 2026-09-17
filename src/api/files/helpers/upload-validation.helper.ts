import { FileType } from '@prisma/client';

import { appConstants } from '../../../common/config/app.constants';
import { apiError } from '../../../common/helpers/errors';

const INVALID_FILE_NAME_PATTERN = /[/\\]|\.\./;

export function normalizeMimeType(mimeType: string): string {
    return mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function validateUploadInitPayload(params: {
    type: FileType;
    filename: string;
    size: number;
    mimeType: string;
}): string {
    const { files } = appConstants;

    if (params.size < 1) {
        throw apiError.badRequest('files.size_too_small');
    }

    if (params.size > files.maxSizeBytes) {
        throw apiError.badRequest('files.size_exceeds_limit', { max: files.maxSizeBytes });
    }

    const maxSizeByType = files.maxSizeByType[params.type];
    if (params.size > maxSizeByType) {
        throw apiError.badRequest('files.size_exceeds_type_limit', { max: maxSizeByType });
    }

    if (INVALID_FILE_NAME_PATTERN.test(params.filename) || params.filename.includes('\0')) {
        throw apiError.badRequest('files.invalid_file_name');
    }

    const allowedMimeTypes = files.allowedMimeTypesByType[params.type];
    if (allowedMimeTypes.length === 0) {
        throw apiError.badRequest('files.type_not_allowed');
    }

    const normalizedMime = normalizeMimeType(params.mimeType);
    if (!allowedMimeTypes.includes(normalizedMime)) {
        throw apiError.badRequest('files.invalid_mime_type');
    }

    return normalizedMime;
}

export function validateActualObject(params: { type: FileType; contentLength: number; contentType: string }): {
    actualSize: bigint;
    actualMimeType: string;
} {
    const { files } = appConstants;
    const actualMimeType = normalizeMimeType(params.contentType);

    if (params.contentLength < 1) {
        throw apiError.badRequest('files.size_too_small');
    }

    if (params.contentLength > files.maxSizeBytes) {
        throw apiError.badRequest('files.actual_size_exceeds_limit');
    }

    const maxSizeByType = files.maxSizeByType[params.type];
    if (params.contentLength > maxSizeByType) {
        throw apiError.badRequest('files.actual_size_exceeds_limit');
    }

    const allowedMimeTypes = files.allowedMimeTypesByType[params.type];
    if (!allowedMimeTypes.includes(actualMimeType)) {
        throw apiError.badRequest('files.actual_mime_invalid');
    }

    return {
        actualSize: BigInt(params.contentLength),
        actualMimeType
    };
}

export function isMultipartUpload(declaredSize: number): boolean {
    return declaredSize > appConstants.files.maxSingleUploadSizeBytes;
}
