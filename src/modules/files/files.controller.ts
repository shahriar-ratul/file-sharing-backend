import * as path from 'node:path';
import { PageOptionsDto } from '@/core/dto';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileOrderDto } from './dto/update-file-order.dto';
import { FilesService } from './files.service';

const storage = {
    storage: diskStorage({
        destination: './public/uploads/files',
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const extension = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${extension}`);
        },
    }),
};

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', storage))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() createFileDto: CreateFileDto) {
        return this.filesService.create(file, createFileDto);
    }

    @Get()
    async findAll(@Query() pageOptionsDto: PageOptionsDto) {
        return this.filesService.findAll(pageOptionsDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.filesService.remove(id);
    }

    @Put('order')
    async updateOrder(@Body() updateFileOrderDto: UpdateFileOrderDto[]) {
        return this.filesService.updateOrder(updateFileOrderDto);
    }
}
