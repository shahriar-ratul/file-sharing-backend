import { PageDto, PageMetaDto, PageOptionsDto } from '@/core/dto';
import { deleteFile } from '@/core/helpers/GenerateHelpers';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileOrderDto } from './dto/update-file-order.dto';

@Injectable()
export class FilesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(file: Express.Multer.File, createFileDto: CreateFileDto) {
        const newFile = await this.prisma.file.create({
            data: {
                url: file.path,
                size: file.size,
                type: file.mimetype,
                userId: '1', // Replace with actual user ID from request
            },
        });

        return {
            message: 'File uploaded successfully',
            data: newFile,
        };
    }

    async findAll(query: PageOptionsDto): Promise<PageDto<any>> {
        const [items, count] = await this.prisma.$transaction([
            this.prisma.file.findMany({
                take: query.limit,
                skip: query.skip,
                orderBy: {
                    createdAt: query.order,
                },
            }),
            this.prisma.file.count(),
        ]);

        const pageMetaDto = new PageMetaDto({
            total: count,
            pageOptionsDto: query,
        });

        return new PageDto(items, pageMetaDto);
    }

    async remove(id: string) {
        const file = await this.prisma.file.findUnique({ where: { id } });
        if (!file) {
            throw new NotFoundException('File not found');
        }

        await this.prisma.file.delete({ where: { id } });
        deleteFile(file.url);

        return {
            message: 'File deleted successfully',
        };
    }

    async updateOrder(updateFileOrderDto: UpdateFileOrderDto[]) {
        await Promise.all(
            updateFileOrderDto.map((item) =>
                this.prisma.file.update({
                    where: { id: item.id },
                    data: { displayOrder: item.order },
                })
            )
        );

        return {
            message: 'File order updated successfully',
        };
    }
}
