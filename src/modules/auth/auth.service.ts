import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { TokenService } from '../users/token/token.service';
import { UsersService } from '../users/user/users.service';
import { LoginDto } from './dto/login.dto';

// 1 day in milliseconds
const EXPIRE_TIME = 1000 * 60 * 60 * 24;

@Injectable()
export class AuthService {
    constructor(
        private _usersService: UsersService,
        private jwtService: JwtService,
        private tokenService: TokenService
    ) {}

    async login(credential: LoginDto, request): Promise<any> {
        const user = await this._usersService.findByUsernameOrEmail(credential.username);

        if (!user) {
            throw new Error('invalid credentials');
        }

        if (!(await bcrypt.compare(credential.password, user.password))) {
            throw new Error('Password is incorrect');
        }

        if (user.isActive === false) {
            throw new Error('Your Have Been Blocked. Please Contact Admin');
        }

        const payload = {
            username: user.username,
            email: user.email,
            sub: user.id,
        };

        const token = await this.jwtService.signAsync(payload, {
            expiresIn: '1d',
            secret: process.env.JWT_SECRET,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
            secret: process.env.JWT_REFRESH_TOKEN_KEY,
        });

        // 1d  = 1 day = 24 hours

        let ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

        // convert ip to string
        ip = ip.toString();

        try {
            await this.tokenService.create({
                token: token,
                refresh_token: refreshToken,
                user_id: Number(user.id),
                ip: ip,
                userAgent: request.headers['user-agent'] || '',
                expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            });
        } catch (error) {
            // console.log(error);
            throw new BadRequestException('Failed to create token');
        }

        return {
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: EXPIRE_TIME,
        };
    }

    async validateUser(credential: LoginDto) {
        const user = await this._usersService.findByUsernameOrEmail(credential.username);

        if (!user) {
            throw new BadRequestException('invalid credentials');
        }

        if (!(await bcrypt.compare(credential.password, user.password))) {
            throw new BadRequestException('Password is incorrect');
        }

        if (user.isActive === false) {
            throw new BadRequestException('Your Have Been Blocked. Please Contact Admin');
        }

        return user;
    }

    async verifyJwt(jwt: string) {
        const { exp } = await this.jwtService.verifyAsync(jwt);

        if (exp < Date.now()) {
            throw new Error('Token expired');
        }

        return { exp };
    }

    async getProfile(req: Request): Promise<any> {
        try {
            const id = (req.user as any).id as number;
            const user = await this._usersService.findById(id.toString());

            return user;
        } catch (error) {
            throw new Error('Invalid Token');
        }
    }
    async verifyToken(req: Request): Promise<any> {
        const id = (req.user as any).id as number;
        const user = await this._usersService.findById(id.toString());

        if (!user) {
            throw new Error('invalid credentials');
        }

        return {
            message: 'success',
        };
    }
}



