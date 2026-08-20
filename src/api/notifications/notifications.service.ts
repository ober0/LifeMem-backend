import { Injectable, Logger } from '@nestjs/common';

import type { NotificationType } from './const/messages';

export type CreateNotificationDto = {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
};

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    async create(data: CreateNotificationDto): Promise<void> {
        // TODO
        this.logger.log(`notification [${data.type}] user=${data.userId}: ${data.title} — ${data.body}`);
    }
}
