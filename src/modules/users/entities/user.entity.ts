import { ApiProperty } from '@nestjs/swagger';
import type { User } from '@prisma/client';

export class UserEntity implements User {
    @ApiProperty({ type: 'string', description: 'user first name' })
    firstName: string;

    @ApiProperty({ type: 'string', description: 'user last name' })
    lastName: string;

    @ApiProperty({ type: 'string', description: 'user id' })
    id: string;

    @ApiProperty({ type: 'string', description: 'user username' })
    username: string;

    @ApiProperty({ type: 'string', description: 'user email' })
    email: string;

    @ApiProperty({ type: 'string', description: 'user password' })
    password: string;

    @ApiProperty({ type: 'string', description: 'user avatar' })
    avatar: string;

    @ApiProperty({ type: 'boolean', description: 'user is active' })
    isActive: boolean;

    @ApiProperty({ type: 'string', format: 'date-time', description: 'user created at' })
    createdAt: Date;

    @ApiProperty({ type: 'string', format: 'date-time', description: 'user updated at' })
    updatedAt: Date;
}
