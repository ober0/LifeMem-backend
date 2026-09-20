import { FileType } from '@prisma/client';

const MB = 1024 * 1024;
const GB = 1024 * MB;

const allowedMimeTypesByType: Record<FileType, readonly string[]> = {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
    VIDEO: ['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp', 'video/x-msvideo'],
    AUDIO: [
        'audio/webm',
        'audio/mpeg',
        'audio/mp4',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/x-m4a',
        'audio/flac'
    ],
    DOCUMENT: [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text'
    ],
    OTHER: []
};

export const filesConstants = {
    maxSizeBytes: GB,
    maxSingleUploadSizeBytes: 20 * MB,
    batchSizeBytes: 20 * MB,
    maxSizeByType: {
        IMAGE: 20 * MB,
        VIDEO: GB,
        AUDIO: 200 * MB,
        DOCUMENT: 50 * MB,
        OTHER: 20 * MB
    },
    allowedMimeTypesByType,
    orphanedUploadMaxAgeMs: 24 * 60 * 60 * 1000,
    uploadPresignExpiresInSec: 3 * 60,
    uploadMultipartPresignExpiresInSec: 30 * 60,
    presignUrlParallelBatchSize: 10,
    testFilePath: 'test/public/test-image.jpg',
    testVideoPath: 'test/public/test-video.mp4'
} as const;
