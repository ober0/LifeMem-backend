import type { EntryFormattedTextFormat, EntryProcessingStatus, Prisma } from '@prisma/client';

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

const entryMediaSelect = {
    media: {
        select: {
            id: true,
            description: true,
            file: true,
            fileId: true,
            firstFrame: {
                select: {
                    key: true
                }
            },
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
    formattedText: true,
    formattedTextFormat: true,
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
            media: true,
            people: true,
            places: true
        }
    }
};

export type SearchEntrySource = {
    id: string;
    title: string;
    text: string | null;
    formattedText: string | null;
    formattedTextFormat: EntryFormattedTextFormat | null;
    isReady: boolean;
    createdAt: Date;
    voice: { id: string } | null;
    jobs: Array<{ status: EntryProcessingStatus }>;
    _count: {
        media: number;
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
    ...entryMediaSelect,
    ...entryVoicesSelect,
    ...entryRelationsSelect
} satisfies Prisma.EntrySelect;

export const entryDetailSelect = {
    id: true,
    userId: true,
    title: true,
    text: true,
    formattedText: true,
    formattedTextFormat: true,
    isReady: true,
    createdAt: true,
    updatedAt: true,
    ...entryMediaSelect,
    ...entryVoicesSelect,
    jobs: {
        select: {
            id: true,
            type: true,
            status: true,
            errorMessages: true,
            createdAt: true,
            updatedAt: true
        },
        orderBy: { createdAt: 'asc' as const }
    },
    people: {
        select: {
            person: {
                select: {
                    id: true,
                    name: true,
                    createdAt: true
                }
            }
        }
    },
    places: {
        select: {
            place: {
                select: {
                    id: true,
                    name: true,
                    createdAt: true
                }
            }
        }
    }
};

export type EntryDetailSource = Prisma.EntryGetPayload<{ select: typeof entryDetailSelect }>;

export const baseEntrySelect = {
    id: true,
    title: true,
    text: true,
    formattedText: true,
    formattedTextFormat: true,
    isReady: true,
    createdAt: true,
    updatedAt: true,
    voice: {
        select: { id: true }
    },
    ...entryMediaSelect,
    ...entryRelationsSelect
} satisfies Prisma.EntrySelect;
