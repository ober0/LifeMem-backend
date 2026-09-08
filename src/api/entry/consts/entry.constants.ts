import type { EntryProcessingStatus, Prisma } from '@prisma/client';

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
};

const entryVoicesSelect = {
    voice: {
        select: {
            id: true,
            file: true,
            fileId: true,
            createdAt: true,
            updatedAt: true
        }
    }
};

export const searchEntrySelect = {
    id: true,
    title: true,
    text: true,
    isReady: true,
    createdAt: true,
    voice: {
        select: { id: true }
    },
    jobs: {
        select: {
            status: true
        }
    },
    _count: {
        select: {
            images: true,
            people: true,
            places: true
        }
    }
};

export type SearchEntrySource = {
    id: string;
    title: string;
    text: string | null;
    isReady: boolean;
    createdAt: Date;
    voice: { id: string } | null;
    jobs: Array<{ status: EntryProcessingStatus }>;
    _count: {
        images: number;
        people: number;
        places: number;
    };
};

export const createEntrySelect = {
    id: true,
    jobs: {
        select: {
            type: true,
            status: true
        }
    },
    ...entryImagesSelect,
    ...entryVoicesSelect,
    ...entryRelationsSelect
} satisfies Prisma.EntrySelect;

export const baseEntrySelect = {
    id: true,
    title: true,
    text: true,
    isReady: true,
    createdAt: true,
    updatedAt: true,
    voice: {
        select: { id: true }
    },
    ...entryImagesSelect,
    ...entryRelationsSelect
} satisfies Prisma.EntrySelect;
