import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleDto } from './dto/base.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
    constructor(private readonly roleRepository: RoleRepository) {}

    async getRoleById(id: string): Promise<RoleDto> {
        const data = await this.roleRepository.getRoleById(id);

        if (!data) {
            throw new NotFoundException('error.role.not_found');
        }

        return data;
    }

    async getDefaultRole(): Promise<RoleDto> {
        const data = await this.roleRepository.getDefaultRole();

        if (!data) {
            throw new NotFoundException('error.role.default_not_found');
        }

        return data;
    }
}
