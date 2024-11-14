import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { CreateTokenDto } from '../dto/create-token.dto';

@Injectable()
export class TokenService {
    constructor(private readonly _prisma: PrismaService) {}

    async create(createTokenDto: CreateTokenDto) {
        this._prisma.token.create({
            data: {
                token: createTokenDto.token || '',
                refreshToken: createTokenDto.refresh_token || '',
                ip: createTokenDto.ip || '',
                userAgent: createTokenDto.userAgent || '',
                expiresAt: createTokenDto.expires_at,
                user: {
                    connect: {
                        id: createTokenDto.user_id.toString(),
                    },
                },
            },
        });

        return {
            message: 'Token Created Successfully',
        };
    }

    async findById(id: number) {
        return await this._prisma.token.findUnique({
            where: {
                id: id,
            },
        });
    }

    async findByAdminId(adminId: number) {
        return await this._prisma.token.findMany({
            include: {
                user: true,
            },
            where: {
                user: {
                    id: adminId.toString(),
                },
            },
        });
    }

    async findByToken(token: string) {
        return await this._prisma.token.findFirst({
            where: {
                token: token,
            },
        });
    }

    // isRevokedToken
    async isRevokedToken(token: string) {
        console.log('token', token);

        const tokenData = await this._prisma.token.findFirst({
            where: {
                token: token,
            },
        });

        console.log('tokenData', tokenData);

        if (!tokenData) {
            return false;
        }

        if (tokenData == null) {
            return false;
        }

        console.log('tokenData.isRevoked', tokenData.isRevoked);
        if (tokenData.isRevoked) {
            return true;
        }

        return false;
    }
}
