import { PageDto, PageMetaDto, PageOptionsDto } from '@/core/dto';
import { deleteFile } from '@/core/helpers/GenerateHelpers';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { File, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileOrderDto } from './dto/update-file-order.dto';

@Injectable()
export class FilesService {
    constructor(private readonly _prisma: PrismaService) {}

    async create(file: Express.Multer.File, createFileDto: CreateFileDto, thumbnailPath: string) {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
            throw new BadRequestException('Invalid file type. Only images and videos are allowed.');
        }

        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
        const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;

        if (isImage && file.size > MAX_IMAGE_SIZE) {
            // 2GB for videos

            throw new BadRequestException('Image size should not exceed 10MB');
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            throw new BadRequestException('Video size should not exceed 2GB');
        }

        const newFile = await this._prisma.file.create({
            data: {
                title: createFileDto.title,
                url: file.path,
                size: file.size,
                type: file.mimetype,
                userId: createFileDto.userId,
                fileType: createFileDto.fileType,
                thumbnailPath: thumbnailPath,
            },
        });

        if (createFileDto.tags.length > 0) {
            await Promise.all(
                createFileDto.tags.map(async (tag) => {
                    const exists = await this._prisma.tag.findFirst({ where: { name: tag } });
                    if (!exists) {
                        const newTag = await this._prisma.tag.create({ data: { name: tag } });

                        return this._prisma.fileTag.create({ data: { fileId: newFile.id, tagId: newTag.id } });
                    }

                    return this._prisma.fileTag.create({ data: { fileId: newFile.id, tagId: exists.id } });
                })
            );
        }

        return {
            message: 'File uploaded successfully',
            data: newFile,
        };
    }

    // get all users
    async findAll(query: PageOptionsDto): Promise<PageDto<File>> {
        const limit: number = query.limit || 10;
        const page: number = query.page || 1;
        const skip: number = (page - 1) * limit;
        const search = query.search || '';

        const sort = query.sort || 'id';

        const order = query.order || 'asc';

        const queryData: Prisma.FileFindManyArgs = {
            include: {
                FileTag: {
                    include: {
                        tag: true,
                    },
                },
            },

            take: limit,
            skip: skip,
            orderBy: {
                [sort]: order.toLowerCase(),
            },
        };
        const [items, count] = await this._prisma.$transaction([
            this._prisma.file.findMany(queryData),
            this._prisma.file.count({ where: queryData.where }),
        ]);

        const pageOptionsDto = {
            limit: limit,
            page: page,
            skip: skip,
        };

        const pageMetaDto = new PageMetaDto({
            total: count,
            pageOptionsDto: pageOptionsDto,
        });

        console.log(process.env.APP_URL);

        const appUrl = process.env.APP_URL;

        // transform the items
        const transformedItems = items.map((item) => ({
            ...item,
            thumbnailPath: item.thumbnailPath ? `${appUrl}/${item.thumbnailPath}` : null,
            url: item.url ? `${appUrl}/${item.url}` : null,
        }));

        return new PageDto(transformedItems, pageMetaDto);
    }

    async findOne(id: string) {
        const file = await this._prisma.file.findUnique({
            where: { id },
            include: {
                FileTag: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        if (!file) {
            throw new NotFoundException('File not found');
        }

        const appUrl = process.env.APP_URL;

        // transform the items
        const transformedItem = {
            ...file,
            thumbnailPath: file.thumbnailPath ? `${appUrl}/${file.thumbnailPath}` : null,
            url: file.url ? `${appUrl}/${file.url}` : null,
        };

        return {
            message: 'File found successfully',
            item: transformedItem,
        };
    }

    async incrementView(id: string) {
        if (!id) {
            throw new BadRequestException('Id is required');
        }

        const file = await this._prisma.file.findUnique({
            where: { id },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        await this._prisma.file.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1,
                },
                lastViewAt: new Date(),
            },
        });

        return {
            message: 'View count incremented successfully',
        };
    }
}
