import { Injectable } from '@nestjs/common';

import { AuthRepository } from '../repo/auth.repository';

@Injectable()
export class AuthCleanupService {
    constructor(private readonly authRepository: AuthRepository) {}

    deleteExpiredRefreshTokens(): Promise<number> {
        return this.authRepository.deleteExpiredRefreshTokens();
    }

    deleteExpiredConfirmationCodes(): Promise<number> {
        return this.authRepository.deleteExpiredConfirmationCodes();
    }
}
