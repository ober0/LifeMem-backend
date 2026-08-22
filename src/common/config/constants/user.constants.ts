const SOFT_DELETE_RETENTION_MONTHS = 3;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

export const userConstants = {
    softDeleteRetentionMonths: SOFT_DELETE_RETENTION_MONTHS,
    softDeleteRetentionMs: SOFT_DELETE_RETENTION_MONTHS * 30 * MS_IN_DAY
} as const;
