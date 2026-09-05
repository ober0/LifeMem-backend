export type ExecuteTimeResult<T> = {
    result: T;
    timeMs: number;
};

export async function getExecuteTime<T>(fn: (...args: any) => Promise<T> | T): Promise<ExecuteTimeResult<T>> {
    const startedAt = Date.now();
    const result = await fn();

    return {
        result,
        timeMs: Date.now() - startedAt
    };
}
