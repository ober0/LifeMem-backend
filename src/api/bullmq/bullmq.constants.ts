export const BullMqQueue = {
    Delayed: 'delayed',
    Entry: 'entry',
    Ai: 'ai',
    LocalEmbedding: 'local-embedding'
} as const;

export type BullMqQueueName = (typeof BullMqQueue)[keyof typeof BullMqQueue];

export const BULLMQ_QUEUE_NAMES: BullMqQueueName[] = [
    BullMqQueue.Delayed,
    BullMqQueue.Entry,
    BullMqQueue.Ai,
    BullMqQueue.LocalEmbedding
];
