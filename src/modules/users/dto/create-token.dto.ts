import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class CreateTokenDto {
    @IsNotEmpty()
    user_id: number;

    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    refresh_token: string;

    @ApiProperty({ type: 'string' })
    @IsNotEmpty()
    ip: string | null;

    @ApiProperty({ type: 'string' })
    @IsNotEmpty()
    userAgent: string;

    @Type(() => Date)
    @ApiProperty({ type: Date })
    @IsNotEmpty()
    expires_at: Date;
}
