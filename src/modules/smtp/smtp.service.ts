import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import * as process from 'node:process';
import { LangEnum } from '../../common/types/lang.enum';
import { CODE_EMAIL_TRANSLATIONS } from './config/code-email.translations';
import { SendCodeEmailParams } from './dto/send-code-email.dto';

@Injectable()
export class SmtpService {
    private readonly logger = new Logger(SmtpService.name);
    private _transporter: nodemailer.Transporter;
    private readonly codeTemplate: string;

    constructor() {
        this.createTransporter();
        this.codeTemplate = this.loadTemplate('code.html');
    }

    async sendCodeEmail({
        to,
        code,
        lang = LangEnum.Ru,
        expiresMinutes = 5
    }: SendCodeEmailParams): Promise<void> {
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
            from: process.env.SMTP_USER,
            to,
            subject: t.subject,
            html,
            text
        });

        this.logger.log(`Code email sent to ${to} [${lang}]`);
    }

    private createTransporter() {
        this._transporter = nodemailer.createTransport({
            host: process.env.SMTP_SERVICE_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    private loadTemplate(fileName: string): string {
        return readFileSync(join(__dirname, 'templates', fileName), 'utf-8');
    }
}
