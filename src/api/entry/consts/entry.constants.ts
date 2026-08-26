import type { Prisma } from '@prisma/client';

const entryRelationsSelect = {
    people: {
        select: {
            person: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    },
    places: {
        select: {
            place: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    }
} satisfies Prisma.EntrySelect;

const entryImagesSelect = {
    images: {
        select: {
            id: true,
            description: true,
            file: true,
            fileId: true,
            createdAt: true,
            updatedAt: true
        }
    }
} satisfies Prisma.EntrySelect;

export const createEntrySelect = {
    id: true,
    jobs: {
        select: {
            type: true,
            status: true
        }
    },
    ...entryImagesSelect,
    ...entryRelationsSelect
} satisfies Prisma.EntrySelect;

export const baseEntrySelect = {
    id: true,
    title: true,
    text: true,
    isReady: true,
    latitude: true,
    longitude: true,
    locationLabel: true,
    createdAt: true,
    updatedAt: true,
    voice: {
        select: { id: true }
    },
    ...entryImagesSelect,
    ...entryRelationsSelect
} satisfies Prisma.EntrySelect;
