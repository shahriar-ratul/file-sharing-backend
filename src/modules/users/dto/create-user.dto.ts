import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsDate,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        type: 'string',
        example: 'admin@admin.com',
        description: 'user email',
    })
    @IsEmail()
    @MaxLength(100)
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        type: 'string',
        example: '123456',
        description: 'user password',
    })
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(255)
    password: string;

    @ApiProperty({
        type: 'string',
        example: 'admin',
        description: 'user username',
    })
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    username: string;

    @ApiProperty({
        type: 'string',
        example: 'admin',
        description: 'user firstName',
    })
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    firstName: string;

    @ApiProperty({
        type: 'string',
        example: 'admin',
        description: 'user lastName',
    })
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    lastName: string;

    @ApiProperty({
        type: 'string',
        example: 'true',
        description: 'user isActive',
    })
    // @IsNotEmpty()
    @Transform(({ value }) => value.toString() === 'true')
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}
