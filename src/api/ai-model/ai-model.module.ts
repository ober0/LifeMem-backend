import { Module } from '@nestjs/common';

import { AiModelController } from './ai-model.controller';
import { AiModelRepository } from './ai-model.repository';
import { AiModelService } from './ai-model.service';

@Module({
    controllers: [AiModelController],
    providers: [AiModelService, AiModelRepository],
    exports: [AiModelService]
})
export class AiModelModule {}
