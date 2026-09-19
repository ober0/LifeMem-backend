import { Injectable } from '@nestjs/common';

import type { Actor } from '../../common/classes/actor';
import { apiError } from '../../common/helpers/errors';
import type { CreatePersonDto } from './dto/create-person.dto';
import type { PersonDto, PersonListResponseDto } from './dto/person.dto';
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

    async create(actor: Actor, dto: CreatePersonDto): Promise<PersonDto> {
        const userId = actor.user.id;
        const name = dto.name.trim();

        if (!name) {
            throw apiError.badRequest('person.name_empty');
        }

        const existing = await this.repository.findByUserAndName(userId, name);
        if (existing) {
            throw apiError.conflict('person.duplicate_name');
        }

        return this.repository.create(userId, name);
    }

    async delete(actor: Actor, id: string): Promise<void> {
        const userId = actor.user.id;
        const deleted = await this.repository.deleteOwned(userId, id);

        if (!deleted) {
            throw apiError.notFound('person.not_found');
        }
    }
}
