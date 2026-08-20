import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as nodemailer from 'nodemailer';
import { join } from 'path';

import type { SmtpConfig} from '../../common/config/env';
import { smtpConfig } from '../../common/config/env';
import { LangEnum } from '../../common/types/common/lang.enum';
import { CODE_EMAIL_TRANSLATIONS } from './config/code-email.translations';
import type { SendCodeEmailParams } from './dto/send-code-email.dto';

@Injectable()
export class SmtpService {
    private readonly logger = new Logger(SmtpService.name);
    private _transporter: nodemailer.Transporter;
    private readonly codeTemplate: string;

    constructor(@Inject(smtpConfig.KEY) private readonly smtp: SmtpConfig) {
        this.createTransporter();
        this.codeTemplate = this.loadTemplate('code.html');
    }

    async sendCodeEmail({ to, code, lang = LangEnum.Ru, expiresMinutes = 5 }: SendCodeEmailParams): Promise<void> {
        const t = CODE_EMAIL_TRANSLATIONS[lang];
        const expires = String(expiresMinutes);

        const html = this.codeTemplate
            .replaceAll('{{LANG}}', lang)
            .replaceAll('{{TAGLINE}}', t.tagline)
            .replaceAll('{{TITLE}}', t.title)
            .replaceAll('{{MESSAGE}}', t.message)
            .replaceAll('{{CODE}}', code)
            .replaceAll('{{EXPIRES_HINT}}', t.expiresHint.replaceAll('{{EXPIRES_MINUTES}}', expires))
            .replaceAll('{{YEAR}}', String(new Date().getFullYear()));

        const text = t.textBody
            .replaceAll('{{TITLE}}', t.title)
            .replaceAll('{{CODE}}', code)
            .replaceAll('{{EXPIRES_MINUTES}}', expires);

        await this._transporter.sendMail({
            from: this.smtp.user,
            to,
            subject: t.subject,
            html,
            text
        });

        this.logger.log(`Code email sent to ${to} [${lang}]`);
    }

    private createTransporter() {
        this._transporter = nodemailer.createTransport({
            host: this.smtp.host,
            port: this.smtp.port,
            secure: true,
            auth: {
                user: this.smtp.user,
                pass: this.smtp.pass
            }
        });
    }

    private loadTemplate(fileName: string): string {
        return readFileSync(join(__dirname, 'templates', fileName), 'utf-8');
    }
}
