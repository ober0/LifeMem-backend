import { registerAs } from '@nestjs/config';

export type SmtpConfig = {
    host: string;
    port: number;
    user: string;
    pass: string;
};

export default registerAs(
    'smtp',
    (): SmtpConfig => ({
        host: process.env.SMTP_SERVICE_HOST ?? '',
        port: Number(process.env.SMTP_PORT) || 465,
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? ''
    })
);
