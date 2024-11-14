import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class CreateFileDto {
    @IsArray()
    @Transform(({ value }) => {
        // Handle string JSON input
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    })
    tags: string[];

    @IsString()
    fileType: string;

    @IsString()
    userId: string;

    @IsString()
    title: string;
}
