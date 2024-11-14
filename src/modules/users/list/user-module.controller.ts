import { Controller, Get, SetMetadata, UseGuards } from '@nestjs/common';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../user/users.service';

@ApiTags('common')
@Controller({
    version: '1',
    path: 'common',
})
@UseGuards(JwtAuthGuard)
export class UserModuleController {
    constructor(private readonly _usersService: UsersService) {}

    // common/all-admins
    @ApiResponse({})
    @Get('/all-admins')
    async getAllAdmins() {
        return this._usersService.getAllUsers();
    }
}
