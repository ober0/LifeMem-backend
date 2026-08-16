import { AuthType } from '@prisma/client';

export type AuthLogCreate = {
    userId: string;
    type: AuthType;
    ip: string;
};
