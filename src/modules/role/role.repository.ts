import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleDto } from './dto/base.dto';

@Injectable()
export class RoleRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getRoleById(id: string): Promise<RoleDto | null> {
        return this.prisma.role.findUnique({
            where: { id }
        });
    }

    async getDefaultRole(): Promise<RoleDto | null> {
        return this.prisma.role.findFirst({
            where: { isDefault: true }
        });
    }
}
