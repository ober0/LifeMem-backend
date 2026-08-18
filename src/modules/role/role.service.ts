import { Injectable } from '@nestjs/common';
import { apiError } from '../../common/errors';
import { RoleDto } from './dto/base.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
    constructor(private readonly roleRepository: RoleRepository) {}

    async getRoleById(id: string): Promise<RoleDto> {
        const data = await this.roleRepository.getRoleById(id);

        if (!data) {
            throw apiError.notFound('role.not_found');
        }

        return data;
    }

    async getDefaultRole(): Promise<RoleDto> {
        const data = await this.roleRepository.getDefaultRole();

        if (!data) {
            throw apiError.notFound('role.default_not_found');
        }

        return data;
    }
}
