import { join } from 'path';
import { Logger, RequestMethod, VERSION_NEUTRAL, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { config as dotenvConfig } from 'dotenv';
import { NextFunction, Request, Response } from 'express';

import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';

async function bootstrap() {
    // Load environment variables from .env file
    dotenvConfig();

    const logger = new Logger();

    const port = process.env.PORT || 4000;

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false,
    });

    app.enableCors({
        origin: '*',
    });

    // Update the static assets path to point to project root
    const publicPath = join(process.cwd(), 'public');

    app.useStaticAssets(publicPath, {
        prefix: '/public/',
    });

    app.use(cookieParser());
    app.use(bodyParser.json({ limit: '2048mb' }));
    app.use(bodyParser.urlencoded({ limit: '2048mb', extended: true }));

    app.setGlobalPrefix('api', {
        exclude: [
            { path: '/', method: RequestMethod.GET },
            { path: 'docs', method: RequestMethod.GET },
            { path: 'public/*', method: RequestMethod.GET },
        ],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidUnknownValues: true,
            forbidNonWhitelisted: true,
        })
    );

    // Enable trust for the proxy
    app.getHttpAdapter().getInstance().set('trust proxy', true);

    // Versioning
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: VERSION_NEUTRAL,
    });

    // Swagger
    // Swagger
    const config = new DocumentBuilder()
        .setTitle('API Documentation')
        .setDescription('API description')
        .setVersion('1.0')
        .addTag('docs')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    // Etag
    (app as any).set('etag', false);

    app.use((req: Request, res: Response, next: NextFunction) => {
        res.removeHeader('x-powered-by');
        res.removeHeader('date');
        if (req.path.startsWith('/public')) {
            const physicalPath = join(process.cwd(), 'public', req.path.replace('/public/', ''));
            console.log({
                requestedPath: req.path,
                physicalPath,
                exists: require('fs').existsSync(physicalPath),
                cwd: process.cwd(),
                fullPath: publicPath,
            });
        }
        next();
    });

    logger.log(`Server running on http://localhost:${port}`);

    await app.listen(port);
}
bootstrap();

