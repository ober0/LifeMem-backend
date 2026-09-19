export const entryProcessingConstants = {
    maxJobErrorAttempts: 3
};

export const entryJobCancelConstants = {
    channelPrefix: 'entry-job-cancel',
    channel(jobId: string) {
        return `${this.channelPrefix}:${jobId}`;
    }
};
