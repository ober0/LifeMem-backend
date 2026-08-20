import { CronExpression } from '@nestjs/schedule';

import { DeleteExpiresConfirmCodesJob } from './tasks/delete-expires-confirm-codes';
import { DeleteExpiresJwtJob } from './tasks/delete-expires-jwt';

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
    }
] as const;
