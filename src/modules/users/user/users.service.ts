import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { PageDto, PageMetaDto, PageOptionsDto } from '../../../core/dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly _prisma: PrismaService) {}

    // get all users
    async findAll(query: PageOptionsDto): Promise<PageDto<Omit<User, 'password'>>> {
        const limit: number = query.limit || 10;
        const page: number = query.page || 1;
        const skip: number = (page - 1) * limit;
        const search = query.search || '';

        const sort = query.sort || 'id';

        const order = query.order || 'asc';

        const isActive = query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;

        const queryData: Prisma.UserFindManyArgs = {
            where: {
                OR: [{ email: { contains: search } }, { username: { contains: search } }],
                ...(isActive !== undefined && { isActive: isActive }),
            },

            include: {
                files: true,
            },

            take: limit,
            skip: skip,
            orderBy: {
                [sort]: order.toLowerCase(),
            },
        };
        const [items, count] = await this._prisma.$transaction([
            this._prisma.user.findMany(queryData),
            this._prisma.user.count({ where: queryData.where }),
        ]);

        const transformedResult = items.map(({ password, ...rest }) => rest);

        const pageOptionsDto = {
            limit: limit,
            page: page,
            skip: skip,
        };

        const pageMetaDto = new PageMetaDto({
            total: count,
            pageOptionsDto: pageOptionsDto,
        });

        return new PageDto(transformedResult, pageMetaDto);
    }

    // add
    async create(createUserDto: CreateUserDto, file: Express.Multer.File) {
        const checkUser = await this._prisma.user.findFirst({
            where: {
                OR: [{ email: createUserDto.email }, { username: createUserDto.username }],
            },
        });

        if (checkUser) {
            throw new HttpException('User already exists ', HttpStatus.BAD_REQUEST);
        }

        const createPassword = await hash(createUserDto.password, 15);

        const user = await this._prisma.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email: createUserDto.email,
                username: createUserDto.username,
                password: createPassword,
                isActive: createUserDto.isActive,
                avatar: file ? file.path : null,
            },
        });

        const { password, ...userDataWithoutPassword } = user;

        return {
            data: userDataWithoutPassword,
            message: 'User Created Successfully',
        };
    }

    // get user by id
    async findById(id: string) {
        const user = await this._prisma.user.findUnique({
            where: {
                id: id,
            },
            include: {
                files: true,
            },
        });

        const { password, ...userDataWithoutPassword } = user;

        return {
            data: userDataWithoutPassword,
        };
    }

    async update(id: string, updateUserDto: UpdateUserDto, file: Express.Multer.File) {
        const data = await this._prisma.user.findFirst({
            where: {
                id: id,
            },
        });

        if (!data) {
            throw new HttpException('User Not Found ', HttpStatus.BAD_REQUEST);
        }

        // check if email or username or mobile exists
        const checkUser = await this._prisma.user.findFirst({
            where: {
                NOT: {
                    id: id,
                },
                OR: [{ email: updateUserDto.email }, { username: updateUserDto.username }],
            },
        });

        if (checkUser) {
            throw new HttpException('User already exists ', HttpStatus.BAD_REQUEST);
        }

        await this._prisma.user.update({
            where: {
                id: id,
            },
            data: {
                email: updateUserDto.email ? updateUserDto.email : data.email,
                username: updateUserDto.username ? updateUserDto.username : data.username,
                isActive: updateUserDto.isActive ? updateUserDto.isActive : data.isActive,
                avatar: file ? file.path : data.avatar,
                firstName: updateUserDto.firstName ? updateUserDto.firstName : data.firstName,
                lastName: updateUserDto.lastName ? updateUserDto.lastName : data.lastName,
            },
        });

        if (updateUserDto.password) {
            const updatePassword = await hash(updateUserDto.password, 15);

            await this._prisma.user.update({
                where: {
                    id: id,
                },
                data: {
                    password: updatePassword,
                },
            });
        }

        const userData = await this._prisma.user.findUnique({
            where: {
                id: id,
            },
            include: {
                files: true,
            },
        });

        const { password, ...userDataWithoutPassword } = userData;

        return {
            data: userDataWithoutPassword,
            message: 'User Updated Successfully',
        };
    }

    async remove(id: string) {
        const user = await this._prisma.user.findFirst({
            where: { id },
            include: {
                files: true,
            },
        });

        if (!user) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        if (user.files.length > 0) {
            throw new HttpException('User has files', HttpStatus.BAD_REQUEST);
        }

        // delete   user
        await this._prisma.user.delete({
            where: {
                id: id,
            },
        });

        return {
            message: 'User deleted successfully',
        };
    }

    async changeStatus(id: string) {
        const user = await this._prisma.user.findFirst({
            where: { id },
        });

        if (!user) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        if (user.username === 'super_admin') {
            throw new HttpException('SuperAdmin status cannot be changed', HttpStatus.BAD_REQUEST);
        }

        await this._prisma.user.update({
            where: {
                id: id,
            },
            data: {
                isActive: !user.isActive,
            },
        });

        return {
            message: 'Status Changed successfully',
        };
    }

    async findByUsername(username: string) {
        return await this._prisma.user.findFirst({ where: { username } });
    }

    async findByEmail(email: string) {
        return await this._prisma.user.findFirst({ where: { email } });
    }

    async findOne(id: string) {
        return await this._prisma.user.findFirst({ where: { id } });
    }

    async findByUsernameOrEmail(username: string) {
        // check if username or email exists
        return await this._prisma.user.findFirst({
            where: {
                OR: [{ email: username }, { username: username }],
            },
        });
    }
    async getAllUsers() {
        const items = await this._prisma.user.findMany({
            where: {
                isActive: true,
            },
        });

        return {
            message: 'Items fetched successfully',
            items: items,
        };
    }
}
