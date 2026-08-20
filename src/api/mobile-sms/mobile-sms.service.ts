import { Injectable } from '@nestjs/common';

import type { Phone } from '../../common/classes/phone';

@Injectable()
export class MobileSmsService {
    async sendMessage(_phone: Phone, _message: string) {
        // TODO реализация отправки

        return true;
    }
}
