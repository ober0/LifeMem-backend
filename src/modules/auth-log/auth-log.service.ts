import { Injectable } from '@nestjs/common';
import { Actor } from '../../common/classes/actor';
import { Permission } from '../../common/config/role-permission';
import { apiError } from '../../common/errors';
import { AuthLogSearchResponseDto } from './dto/base.dto';
import { AuthLogSearchDto } from './dto/search.dto';
import { AuthLogRepository } from './auth-log.repository';
import { AuthLogCreate } from './dto/create';

@Injectable()
export class AuthLogService {
    constructor(private readonly repository: AuthLogRepository) {}

    async create(data: AuthLogCreate) {
        return this.repository.create(data);
    }

    async search(dto: AuthLogSearchDto, actor: Actor): Promise<AuthLogSearchResponseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('error.auth.unauthorized');
        }

        const requestedUserId = dto.filters?.userId;
        const canReadOthers = actor.hasPermission(Permission.AuthLogsRead);

        if (!requestedUserId) {
            if (!canReadOthers) {
                dto = {
                    ...dto,
                    filters: {
                        ...dto.filters,
                        userId: actor.user.id
                    }
                };
            }
        } else if (requestedUserId !== actor.user.id && !canReadOthers) {
            throw apiError.forbidden('error.auth.forbidden');
        }

        const [data, count] = await Promise.all([this.repository.search(dto), this.repository.count(dto)]);

        return { data, count };
    }
}
