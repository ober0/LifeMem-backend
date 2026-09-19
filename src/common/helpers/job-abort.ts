export class JobAbortedError extends Error {
    readonly name = 'JobAbortedError';
}

export function assertNotAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new JobAbortedError();
    }
}

export function isJobAbortedError(error: unknown): error is JobAbortedError {
    return error instanceof JobAbortedError;
}
