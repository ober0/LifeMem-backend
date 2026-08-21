import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { Permission } from '../../common/config/role-permission';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { UserAdminSearchDto, UserAdminSearchResponseDto } from './dto/admin-search.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';

@ApiTags('Admin/User')
@Controller('admin/user')
export class UserAdminController {
    constructor(private readonly userService: UserService) {}

    @Post('search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Поиск пользователей' })
    @ApiOkResponse({ type: UserAdminSearchResponseDto })
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.UsersSearch] }))
    @ApiErrorResponses(400, 401, 403)
    async search(@Body() dto: UserAdminSearchDto): Promise<UserAdminSearchResponseDto> {
        return this.userService.adminSearch(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Редактирование пользователя' })
    @ApiOkResponse({ type: UserDto })
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.UsersAdminUpdate] }))
    @ApiErrorResponses(400, 401, 403, 404, 409)
    async update(
        @CurrentActor() actor: Actor,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AdminUpdateUserDto
    ): Promise<UserDto> {
        return this.userService.adminUpdate(actor, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удаление пользователя' })
    @ApiOkResponse({ type: UserDto })
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.UsersAdminDelete] }))
    @ApiErrorResponses(400, 401, 403, 404)
    async delete(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
        return this.userService.adminDelete(actor, id);
    }
}
