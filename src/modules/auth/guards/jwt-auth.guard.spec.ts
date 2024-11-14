import { JwtAuthGuard } from './jwt-auth.guard';
import { createMock } from '@golevelup/ts-jest';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Reflector } from '@nestjs/core';

// Mock the entire @nestjs/passport module
jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn(() => {
        return class MockAuthGuard {
            canActivate(context: ExecutionContext) {
                return true;
            }
        };
    }),
}));

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let jwtService: JwtService;
    let reflector: Reflector;

    beforeEach(() => {
        jwtService = createMock<JwtService>();
        reflector = createMock<Reflector>();
        guard = new JwtAuthGuard(jwtService, reflector);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should return true for public routes', async () => {
        const context = createMock<ExecutionContext>();

        // Simulate a public route
        reflector.getAllAndOverride = jest.fn().mockReturnValue(true);

        expect(await guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
        const context = createMock<ExecutionContext>();

        // Simulate a non-public route
        reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
        context.switchToHttp().getRequest.mockReturnValue({
            headers: {
                authorization: '',
            },
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
            UnauthorizedException
        );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
        const context = createMock<ExecutionContext>();

        // Simulate a non-public route
        reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
        context.switchToHttp().getRequest.mockReturnValue({
            headers: {
                authorization: 'Bearer invalid_token',
            },
        });

        // Mock jwtService verify to throw an error
        jwtService.verifyAsync = jest.fn().mockRejectedValue(new Error('Invalid token'));

        await expect(guard.canActivate(context)).rejects.toThrow(
            UnauthorizedException
        );
    });

    it('should return true for valid token', async () => {
        const context = createMock<ExecutionContext>();

        reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
        const mockRequest = {
            headers: {
                authorization: 'Bearer valid_token',
            },
        };
        context.switchToHttp().getRequest.mockReturnValue(mockRequest);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
    });
});
