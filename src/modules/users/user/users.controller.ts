import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    SetMetadata,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

import { PageDto, PageOptionsDto } from '@/core/dto';
import { FileInterceptor } from '@nestjs/platform-express';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { diskStorage } from 'multer';

export const storageAdmin = {
    storage: diskStorage({
        destination: './public/uploads/users',
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const extension: string = path.extname(file.originalname);
            const filename = `${uniqueSuffix}${extension}`;
            // const filename: string = `${uniqueSuffix}${extension}`;
            cb(null, filename);
        },
    }),
};

const deleteFile = (path: string) => {
    fs.unlink(path, (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
};

@ApiTags('users')
@Controller({ version: '1', path: 'users' })
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly _usersService: UsersService) {}

    @Get()
    @ApiResponse({})
    @SetMetadata('permissions', ['admin.view'])
    async findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Omit<User, 'password'>>> {
        return await this._usersService.findAll(pageOptionsDto);
    }

    @Post()
    @ApiResponse({
        status: 201,
        description: 'The record has been successfully created.',
    })
    @SetMetadata('permissions', ['admin.create'])
    @UseInterceptors(FileInterceptor('image', storageAdmin))
    async create(
        @UploadedFile()
        image: Express.Multer.File,
        @Body() createUserDto: CreateUserDto
    ) {
        // if (!image) {
        //   throw new Error("Image is required");
        // }

        return this._usersService.create(createUserDto, image);
    }

    @Get(':id')
    @ApiResponse({})
    @SetMetadata('permissions', ['admin.view'])
    async findOne(@Param('id') id: string) {
        return this._usersService.findById(id);
    }

    @Put(':id')
    @ApiResponse({})
    @SetMetadata('permissions', ['admin.update'])
    @UseInterceptors(FileInterceptor('image', storageAdmin))
    async update(
        @Param('id') id: string,
        @UploadedFile()
        image: Express.Multer.File,
        @Body() updateUserDto: UpdateUserDto
    ) {
        return this._usersService.update(id, updateUserDto, image);
    }

    @Delete(':id')
    @ApiResponse({})
    @SetMetadata('permissions', ['admin.delete'])
    async remove(@Param('id') id: string) {
        return this._usersService.remove(id);
    }

    @Post(':id/status')
    @ApiResponse({})
    @SetMetadata('permissions', ['admin.status'])
    async changeStatus(@Param('id') id: string) {
        return this._usersService.changeStatus(id);
    }
}
