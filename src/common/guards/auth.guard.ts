import type { CanActivate, ExecutionContext, Type } from '@nestjs/common';
import { HttpException, Inject, Injectable, mixin } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { UserService } from '../../api/user/user.service';
import type { AuthConfig } from '../config/env';
import { authConfig } from '../config/env';
import type { PermissionKey } from '../config/role-permission';
import { apiError } from '../helpers/errors';
import { getDeviceType } from '../helpers/get-device-type';
import { DeviceType } from '../types/user';

export function JwtAuthGuardHttp({
    allowUnauthorized = false,
    permissions = []
}: {
    allowUnauthorized?: boolean;
    permissions?: PermissionKey[];
}): Type<CanActivate> {
    @Injectable()
    class JwtAuthGuardHttpMixin implements CanActivate {
        constructor(
            private readonly userService: UserService,
            @Inject(authConfig.KEY) private readonly auth: AuthConfig
        ) {}

        async canActivate(context: ExecutionContext): Promise<boolean> {
            if (context.getType() !== 'http') {
                throw apiError.badRequest('auth.invalid_request_type');
            }

            const req = context.switchToHttp().getRequest<Request>();
            const deviceType = getDeviceType(req);

            const token = this.tryGetToken(req, deviceType);

            if (!token) {
                if (allowUnauthorized) {
                    this.assertPermissions(req, permissions);
                    return true;
                }
                throw apiError.unauthorized('auth.unauthorized');
            }

            try {
                const payload = this.verifyAccessToken(token);
                req.decodedToken = payload;

                const data = await this.userService.findAuthUserById(payload.id);
                req.actor.setUser(data.user);
                req.actor.setPermissions(data.permissions);
                req.actor.setSettings(data.settings);
            } catch (error) {
                if (allowUnauthorized) {
                    this.assertPermissions(req, permissions);
                    return true;
                }
                throw error;
            }

            this.assertPermissions(req, permissions);
            return true;
        }

        private verifyAccessToken(token: string): jwt.JwtPayload & { id: string } {
            try {
                const payload = jwt.verify(token, this.auth.jwtAccessSecret);

                if (!payload || typeof payload === 'string' || typeof payload.id !== 'string') {
                    throw apiError.unauthorized('auth.unauthorized');
                }

                return payload as jwt.JwtPayload & { id: string };
            } catch (error) {
                if (error instanceof HttpException) {
                    throw error;
                }
                throw apiError.unauthorized('auth.unauthorized');
            }
        }

        private tryGetToken(req: Request, deviceType: DeviceType): string | null {
            if (deviceType === DeviceType.MOBILE) {
                return this.extractToken(req.headers?.authorization);
            }

            const cookieToken = req.cookies?.accessToken;
            return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : null;
        }

        private extractToken(header?: string): string | null {
            if (!header) {
                return null;
            }

            const parts = header.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
                return null;
            }

            return parts[1];
        }

        private assertPermissions(req: Request, required: PermissionKey[]): void {
            if (required.length === 0) {
                return;
            }

            if (!req.actor.isAuthorized()) {
                throw apiError.unauthorized('auth.unauthorized');
            }

            for (const permission of required) {
                if (!req.actor.hasPermission(permission)) {
                    throw apiError.forbidden('auth.forbidden');
                }
            }
        }
    }

    return mixin(JwtAuthGuardHttpMixin);
}
