import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as process from 'node:process';

@Injectable()
export class SmtpService {
    private _transporter: nodemailer.Transporter;

    constructor() {
        this.createTransporter();
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
}
