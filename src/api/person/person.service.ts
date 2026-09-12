import { Injectable } from '@nestjs/common';

import type { Actor } from '../../common/classes/actor';
import type { PersonListResponseDto } from './dto/person.dto';
import type { PersonListQueryDto } from './dto/person-list-query.dto';
import { PersonRepository } from './person.repository';

@Injectable()
export class PersonService {
    constructor(private readonly repository: PersonRepository) {}

    async list(actor: Actor, dto: PersonListQueryDto): Promise<PersonListResponseDto> {
        const userId = actor.user!.id;

        const [data, count] = await Promise.all([
            this.repository.findMany(userId, dto),
            this.repository.count(userId, dto)
        ]);

        return { data, count };
    }
}
