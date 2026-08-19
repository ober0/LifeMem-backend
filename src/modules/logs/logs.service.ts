import { Injectable } from '@nestjs/common';

import type { LogsCreateDto, LogsSearchResponseDto } from './dto/base.dto';
import type { LogsSearchDto } from './dto/search.dto';
import { LogsRepository } from './logs.repository';

@Injectable()
export class LogsService {
    constructor(private readonly repository: LogsRepository) {}

    async search(dto: LogsSearchDto): Promise<LogsSearchResponseDto> {
        const [data, count] = await Promise.all([this.repository.search(dto), this.repository.count(dto)]);

        return {
            data,
            count
        };
    }

    async create(data: LogsCreateDto) {
        return this.repository.create(data);
    }
}
