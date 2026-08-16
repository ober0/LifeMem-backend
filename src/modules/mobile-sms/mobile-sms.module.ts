import { Module } from '@nestjs/common';
import { MobileSmsService } from './mobile-sms.service';

@Module({
    providers: [MobileSmsService],
    exports: [MobileSmsService]
})
export class MobileSmsModule {}
