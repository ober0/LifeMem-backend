export const entryProcessingConstants = {
    maxJobErrorAttempts: 3,
    jobCancel: {
        channelPrefix: 'entry-job-cancel',
        channelPattern: 'entry-job-cancel:*',
        channel(jobId: string) {
            return `${entryProcessingConstants.jobCancel.channelPrefix}:${jobId}`;
        },
        jobIdFromChannel(channel: string): string | null {
            const prefix = `${entryProcessingConstants.jobCancel.channelPrefix}:`;
            if (!channel.startsWith(prefix)) {
                return null;
            }

            const jobId = channel.slice(prefix.length);
            return jobId.length > 0 ? jobId : null;
        }
    }
};
