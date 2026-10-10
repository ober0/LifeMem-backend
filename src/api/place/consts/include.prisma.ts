import type { Prisma } from '@prisma/client';

export const placeSelect = {
    id: true,
    name: true,
    fullName: true,
    latitude: true,
    longitude: true,
    autodetected: true,
    createdAt: true,
    updatedAt: true
} satisfies Prisma.PlaceSelect;

export const placeMapSelect = {
    id: true,
    name: true,
    fullName: true,
    latitude: true,
    longitude: true,
    entries: {
        where: {
            entry: {
                deletedAt: null
            }
        },
        orderBy: { createdAt: 'desc' },
        select: {
            entry: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
    }
} satisfies Prisma.PlaceSelect;
