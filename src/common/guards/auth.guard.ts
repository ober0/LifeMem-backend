import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    mixin,
    Type,
    UnauthorizedException
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../../modules/user/user.service';
import { PermissionKey } from '../config/role-permission';
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
        constructor(private readonly userService: UserService) {}

        async canActivate(context: ExecutionContext): Promise<boolean> {
            if (context.getType() !== 'http') {
                throw new BadRequestException('error.auth.invalid_request_type');
            }

            const req = context.switchToHttp().getRequest<Request>();
            const deviceType = getDeviceType(req);

            const token = this.tryGetToken(req, deviceType);

            if (!token) {
                if (allowUnauthorized) {
                    this.assertPermissions(req, permissions);
                    return true;
                }
                throw new UnauthorizedException('error.auth.unauthorized');
            }

            try {
                const data = await this.userService.getUserInfoFromToken(token);
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
                throw new UnauthorizedException('error.auth.unauthorized');
            }

            for (const permission of required) {
                if (!req.actor.hasPermission(permission)) {
                    throw new ForbiddenException('error.auth.forbidden');
                }
            }
        }
    }

    return mixin(JwtAuthGuardHttpMixin);
}
