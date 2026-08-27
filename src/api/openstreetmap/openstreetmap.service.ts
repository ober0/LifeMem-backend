import { Injectable, Logger } from '@nestjs/common';

import { LangEnum } from '../../common/types/common/lang.enum';
import { OpenstreetReverseResponse } from './types';

@Injectable()
export class OpenstreetmapService {
    private readonly baseUrl = 'https://nominatim.openstreetmap.org';

    private readonly logger: Logger = new Logger(OpenstreetmapService.name);

    async getNearestLocName(
        latitude: number,
        longitude: number,
        lang: LangEnum = LangEnum.En
    ): Promise<OpenstreetReverseResponse | null> {
        const params = new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: 'jsonv2',
            zoom: '18',
            layer: 'address,natural',
            'accept-language': lang.toLowerCase()
        });

        const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
            headers: {
                'User-Agent': 'LifeMem/0.0.1 (contact@lifemem.app)',
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            this.logger.warn(`Ошибка при запросе к openstreetmap: ${response.status}`);
            return null;
        }

        const data = await response.json();

        return {
            shortName: data.name && data.name.length > 3 ? data.name : data.address.road,
            fullName: data.display_name,
            json: {
                country: {
                    name: data.address.country,
                    code: data.address.country_code
                },
                region: data.address.region,
                city: data.address.city,
                suburb: data.address.suburb,
                quarter: data.address.quarter,
                neighbourhood: data.address.neighbourhood,
                road: data.address.road,
                house: data.address.house_number
            }
        };
    }
}
