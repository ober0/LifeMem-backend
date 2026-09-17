import { Module } from '@nestjs/common';

import { AiModelRepository } from './ai-model.repository';
import { AiModelService } from './ai-model.service';

@Module({
    providers: [AiModelService, AiModelRepository],
    exports: [AiModelService]
})
export class AiModelCoreModule {}
