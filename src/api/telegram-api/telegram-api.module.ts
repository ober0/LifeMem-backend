import { Module } from '@nestjs/common';

import { TelegramApiService } from './telegram-api.service';

@Module({
    providers: [TelegramApiService],
    exports: [TelegramApiService]
})
export class TelegramApiModule {}
