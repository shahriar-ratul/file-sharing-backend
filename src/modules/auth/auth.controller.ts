import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { Public } from '@/core/decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private _authService: AuthService) { }

    /**
     * Login users
     */
    @SkipThrottle()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiResponse({
        status: 200,
        description: 'Login Successful',
    })
    @Public()
    async login(
        @Body() credential: LoginDto,
        @Req() request: Request,
        // @Res({ passthrough: true }) response: Response,
    ): Promise<any> {
        return await this._authService.login(credential, request);
    }

    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Get Profile Successful',
    })
    @Get('profile')
    async getProfile(@Req() req: Request) {
        return await this._authService.getProfile(req);
    }

    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Verify Successful',
    })
    @Get('verify')
    async verify(@Req() req: Request) {
        return await this._authService.verifyToken(req);
    }
}
