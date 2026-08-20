export const throttleConstants = {
    ip: {
        ttlMs: 60000,
        limit: 20
    },
    user: {
        ttlMs: 60000,
        limit: 100
    }
} as const;
