import { Prisma } from '@prisma/client';

export const authUserInclude = {
    userSettings: true,
    role: {
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    }
} satisfies Prisma.UserInclude;

export type AuthUserRecord = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;
