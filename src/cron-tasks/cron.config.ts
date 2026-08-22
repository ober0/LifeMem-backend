import { CronExpression } from '@nestjs/schedule';

import { DeleteExpiresConfirmCodesJob } from './tasks/delete-expires-confirm-codes';
import { DeleteExpiresJwtJob } from './tasks/delete-expires-jwt';
import { DeleteSoftDeletedUsersJob } from './tasks/delete-soft-deleted-users';

export const cronConfig = [
    {
        name: 'delete-expires-jwt',
        schedule: CronExpression.EVERY_10_MINUTES,
        job: DeleteExpiresJwtJob
    },
    {
        name: 'delete-expires-confirm-codes',
        schedule: CronExpression.EVERY_10_MINUTES,
        job: DeleteExpiresConfirmCodesJob
    },
    {
        name: 'delete-soft-deleted-users',
        schedule: CronExpression.EVERY_DAY_AT_3AM,
        job: DeleteSoftDeletedUsersJob
    }
] as const;
