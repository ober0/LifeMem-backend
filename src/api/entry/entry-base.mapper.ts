import type { EntryFormattedTextFormat } from '@prisma/client';

export type EntryCoreFieldsSource = {
    id: string;
    title: string;
    text: string | null;
    formattedText: string | null;
    formattedTextFormat: EntryFormattedTextFormat | null;
};

export type EntryCoreWithCreatedAtSource = EntryCoreFieldsSource & {
    createdAt: Date;
};

export type EntryCoreWithReadySource = EntryCoreWithCreatedAtSource & {
    isReady: boolean;
};

export type EntryCoreFullSource = EntryCoreWithReadySource & {
    updatedAt: Date;
};

export const entryBaseMapper = {
    coreFields(source: EntryCoreFieldsSource) {
        return {
            id: source.id,
            title: source.title,
            text: source.text,
            formattedText: source.formattedText,
            formattedTextFormat: source.formattedTextFormat
        };
    },

    withCreatedAt(source: EntryCoreWithCreatedAtSource) {
        return {
            ...entryBaseMapper.coreFields(source),
            createdAt: source.createdAt
        };
    },

    withReady(source: EntryCoreWithReadySource) {
        return {
            ...entryBaseMapper.withCreatedAt(source),
            isReady: source.isReady
        };
    },

    withTimestamps(source: EntryCoreFullSource) {
        return {
            ...entryBaseMapper.withReady(source),
            updatedAt: source.updatedAt
        };
    }
};
