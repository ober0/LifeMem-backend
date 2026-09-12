import { Module } from '@nestjs/common';

import { PersonController } from './person.controller';
import { PersonRepository } from './person.repository';
import { PersonService } from './person.service';

@Module({
    controllers: [PersonController],
    providers: [PersonService, PersonRepository]
})
export class PersonModule {}
