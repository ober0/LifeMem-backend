import { Injectable, Logger } from '@nestjs/common';

import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';

@Injectable()
export class EntryLocationService {
    private readonly logger = new Logger(EntryLocationService.name);

    async processEntryLocation(data: DelayedJobPayloads[typeof DelayedJob.EntryLocation]): Promise<void> {
        this.logger.log(
            `Process entry location entryId=${data.entryId} lat=${data.latitude} lng=${data.longitude}` +
                (data.locationLabel ? ` label=${data.locationLabel}` : '')
        );
    }
}
