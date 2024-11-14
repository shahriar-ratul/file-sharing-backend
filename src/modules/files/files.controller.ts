import * as fs from 'node:fs';
import * as path from 'node:path';
import { Public } from '@/core/decorator';
import { PageDto, PageOptionsDto } from '@/core/dto';
import {
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UnauthorizedException,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { File } from '@prisma/client';
import { Request } from 'express';
import * as ffmpeg from 'fluent-ffmpeg';
import { diskStorage } from 'multer';
import * as sharp from 'sharp';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { FilesService } from './files.service';

const storage = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            const fileType = file.mimetype.split('/')[0];
            const uploadPath = `./public/uploads/${fileType}s`;

            fs.mkdirSync(uploadPath, { recursive: true });

            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const extension = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${extension}`);
        },
    }),
};

@ApiTags('files')
@Controller({ version: '1', path: 'files' })
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            ...storage,
            limits: {
                fileSize: 2 * 1024 * 1024 * 1024, // 2GB in bytes
            },
        })
    )
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({
                        fileType: /(image|video)\/.*/,
                    }),
                ],
            })
        )
        file: Express.Multer.File,
        @Body() createFileDto: CreateFileDto,
        @Req() req: Request & { user: any }
    ) {
        if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
        }

        let thumbnailPath: string | undefined;
        const thumbnailFileName = `thumbnail-${path.parse(file.filename).name}.jpg`;
        thumbnailPath = path.join('./public/uploads/images', thumbnailFileName);

        if (file.mimetype.startsWith('video')) {
            await new Promise((resolve, reject) => {
                ffmpeg(file.path)
                    .screenshots({
                        timestamps: ['00:00:01'],
                        filename: thumbnailFileName,
                        folder: './public/uploads/images',
                        size: '320x240',
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else if (file.mimetype.startsWith('image')) {
            await sharp(file.path)
                .resize(320, 240, {
                    fit: 'cover',
                    position: 'center',
                })
                .toFile(thumbnailPath);
        }

        return this.filesService.create(file, createFileDto, thumbnailPath);
    }

    @Get()
    async findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<File>> {
        return this.filesService.findAll(pageOptionsDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.filesService.findOne(id);
    }

    @Public()
    @Get('public/:id')
    async getPublicFile(@Param('id') id: string) {
        return this.filesService.findOne(id);
    }

    @Public()
    @Post('public/:id/view')
    async incrementView(@Param('id') id: string) {
        return this.filesService.incrementView(id);
    }
}
