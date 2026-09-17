import { Module } from '@nestjs/common';

import { AiModelController } from './ai-model.controller';
import { AiModelCoreModule } from './ai-model.core.module';

@Module({
    imports: [AiModelCoreModule],
    controllers: [AiModelController],
    exports: [AiModelCoreModule]
})
export class AiModelModule {}
