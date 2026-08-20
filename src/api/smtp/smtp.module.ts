import { Module } from '@nestjs/common';

import { SmtpService } from './smtp.service';

@Module({
    exports: [SmtpService],
    providers: [SmtpService]
})
export class SmtpModule {}
