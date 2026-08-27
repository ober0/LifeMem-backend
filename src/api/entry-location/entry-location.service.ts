import { Injectable, Logger } from '@nestjs/common';

import { apiError } from '../../common/helpers/errors';
import { LangEnum } from '../../common/types/common/lang.enum';
import {
    DelayedJob,
    type DelayedJobPayloads,
    type EntryLocationCoordPayload
} from '../delayed-worker/delayed-worker.constants';
import { OpenstreetmapService } from '../openstreetmap/openstreetmap.service';
import { OpenstreetReverseResponse } from '../openstreetmap/types';
import { UserService } from '../user/user.service';
import { EntryLocationRepository } from './entry-location.repository';
import { CreateLocationDto } from './types';

@Injectable()
export class EntryLocationService {
    private readonly logger = new Logger(EntryLocationService.name);

    constructor(
        private readonly repository: EntryLocationRepository,
        private readonly openstreetmap: OpenstreetmapService,
        private readonly userService: UserService
    ) {}

    async processEntryLocation(data: DelayedJobPayloads[typeof DelayedJob.EntryLocation]) {
        for (const item of data.locations) {
            await this.processOneLocation(item, data.userId, data.entryId, data.userLang);
        }

        return true;
    }

    private async processOneLocation(
        item: EntryLocationCoordPayload,
        userId: string,
        entryId: string,
        userLang?: LangEnum
    ) {
        const location: OpenstreetReverseResponse | null = await this.getLocation({
            latitude: item.latitude,
            longitude: item.longitude,
            label: item.locationLabel,
            userLang: userLang
        });

        if (!location && !item.locationLabel) {
            throw apiError.internal('entry.location_required');
        }

        const createData: CreateLocationDto = {
            ...location,
            latitude: item.latitude,
            longitude: item.longitude,
            shortName: item.locationLabel ?? location?.shortName ?? ''
        };

        this.logger.log(`creating place for entryId=${entryId} lat=${item.latitude} lng=${item.longitude}`);
        await this.repository.createLocation(createData, userId, entryId);
    }

    private async getLocation(data: {
        latitude: number;
        longitude: number;
        label: string | undefined;
        userLang: LangEnum | undefined;
    }) {
        const userName = data.label;

        const openstreetData = await this.openstreetmap.getNearestLocName(data.latitude, data.longitude, data.userLang);

        if (!openstreetData) {
            return null;
        }

        return {
            ...openstreetData,
            shortName: userName ?? openstreetData?.shortName
        };
    }
}
