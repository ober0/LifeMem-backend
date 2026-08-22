import { HttpException } from '@nestjs/common';
import { ConfirmCodeType } from '@prisma/client';

import { UserService } from '../../../../src/api/user/user.service';
import { Actor } from '../../../../src/common/classes/actor';

jest.mock('../../../../src/common/helpers/generate-code', () => ({
    generateCode: () => 123456
}));

async function expectApiCode(promise: Promise<unknown>, code: string, status: number): Promise<void> {
    let error: unknown;
    try {
        await promise;
    } catch (err) {
        error = err;
    }

    expect(error).toBeInstanceOf(HttpException);
    const exception = error as HttpException;
    expect(exception.getStatus()).toBe(status);
    expect(exception.getResponse()).toEqual(expect.objectContaining({ code }));
}

describe('UserService addPhone/addEmail', () => {
    const userRepository = {
        findByPhoneNumber: jest.fn(),
        setPhoneNumber: jest.fn(),
        createConfirmationCode: jest.fn(),
        findByEmail: jest.fn(),
        setEmailWithPassword: jest.fn()
    };

    const roleService = {};
    const smtpService = { sendCodeEmail: jest.fn() };
    const mobileSmsService = { sendMessage: jest.fn() };
    const auth = { saltRounds: 10, jwtAccessSecret: 'a', jwtRefreshSecret: 'r' };
    const appConfig = { isProduction: false };

    let service: UserService;

    const actorWith = (user: Partial<{ id: string; phoneNumber: string | null; email: string | null }>) => {
        const actor = Actor.create();
        actor.setUser({
            id: user.id ?? 'user-1',
            nickname: 'n',
            passwordId: null,
            email: user.email ?? null,
            phoneNumber: user.phoneNumber ?? null,
            isEmailVerified: false,
            isPhoneVerified: false,
            roleId: 'role-1',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        actor.setHeaderLang({ headers: { 'accept-language': 'en' } } as never);
        return actor;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UserService(
            auth as never,
            appConfig as never,
            userRepository as never,
            roleService as never,
            smtpService as never,
            mobileSmsService as never
        );
    });

    describe('addPhone', () => {
        it('rejects when phone already bound', async () => {
            await expectApiCode(
                service.addPhone(actorWith({ phoneNumber: '79991112233' }), { phoneNumber: '+79990001122' }),
                'user.phone_already_bound',
                409
            );
        });

        it('rejects invalid phone', async () => {
            await expectApiCode(
                service.addPhone(actorWith({ phoneNumber: null }), { phoneNumber: 'bad' }),
                'user.phone_not_correct',
                400
            );
        });

        it('rejects when phone taken by another user', async () => {
            userRepository.findByPhoneNumber.mockResolvedValue({ id: 'other' });

            await expectApiCode(
                service.addPhone(actorWith({ phoneNumber: null }), { phoneNumber: '+79991234567' }),
                'user.phone_already_exists',
                409
            );
        });

        it('saves phone and confirmation code', async () => {
            userRepository.findByPhoneNumber.mockResolvedValue(null);
            userRepository.setPhoneNumber.mockResolvedValue({});
            userRepository.createConfirmationCode.mockResolvedValue({});

            const result = await service.addPhone(actorWith({ phoneNumber: null }), {
                phoneNumber: '+79991234567'
            });

            expect(userRepository.setPhoneNumber).toHaveBeenCalledWith('user-1', '79991234567');
            expect(userRepository.createConfirmationCode).toHaveBeenCalledWith({
                type: ConfirmCodeType.Phone,
                code: 123456,
                userId: 'user-1'
            });
            expect(result.alert).toBe(true);
            expect(result.message).toContain('123456');
        });
    });

    describe('addEmail', () => {
        it('rejects when email already bound', async () => {
            await expectApiCode(
                service.addEmail(actorWith({ email: 'a@b.c' }), { email: 'x@y.z', password: 'Str0ng!Pass1' }),
                'user.email_already_bound',
                409
            );
        });

        it('rejects when email taken', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 'other' });

            await expectApiCode(
                service.addEmail(actorWith({ email: null }), { email: 'x@y.z', password: 'Str0ng!Pass1' }),
                'user.email_already_exists',
                409
            );
        });

        it('saves email password and confirmation code', async () => {
            userRepository.findByEmail.mockResolvedValue(null);
            userRepository.setEmailWithPassword.mockResolvedValue({ id: 'user-1' });
            userRepository.createConfirmationCode.mockResolvedValue({});

            const result = await service.addEmail(actorWith({ email: null }), {
                email: 'new@lifemem.test',
                password: 'Str0ng!Pass1'
            });

            expect(userRepository.setEmailWithPassword).toHaveBeenCalledWith(
                'user-1',
                'new@lifemem.test',
                expect.any(String)
            );
            expect(userRepository.createConfirmationCode).toHaveBeenCalledWith({
                type: ConfirmCodeType.Email,
                code: 123456,
                userId: 'user-1'
            });
            expect(result.alert).toBe(true);
        });
    });
});
