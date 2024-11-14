import { MiddlewareConsumer, Module, NestModule, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { join } from 'node:path';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ErrorFilter } from './core/filters';
import { ResponseInterceptor } from './core/interceptor';
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import { RequestLoggerMiddleware } from './core/middleware/request-logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { FilesModule } from './modules/files/files.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MulterModule.register({
            dest: './public',
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 1000,
            },
        ]),
        AuthModule,
        UsersModule,
        FilesModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },

        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },

        {
            provide: APP_PIPE,
            useFactory: () =>
                new ValidationPipe({
                    exceptionFactory: (errors: ValidationError[]) => {
                        return errors[0];
                    },
                }),
        },

        Reflector,
    ],
    exports: [ConfigModule],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
        consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    }
}
