import {
    type ArgumentsHost,
    Catch,
    type ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ValidationError } from 'class-validator';

import { BadRequestException } from '../exceptions/bad-request.exception';
import { ErrorResponse } from '../interfaces/response.interfaces';
import { format } from 'date-fns';

/**
 * An exception filter to handle validation errors thrown by class-validator.
 */
@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ValidationExceptionFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    /**
     * Handle a validation error.
     * @param exception The validation error object.
     * @param host The arguments host object.
     */
    catch(exception: ValidationError, host: ArgumentsHost): void {
        this.logger.verbose(exception);

        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

        const request = ctx.getRequest();
        // Example of fetching path to attach path inside response object
        // const path = httpAdapter.getRequestUrl(request);

        this.logger.log(exception);

        let errorMsg: string[] = [];

        if (exception.constraints) {
            errorMsg = Object.values(exception.constraints);
        } else if (exception.children?.[0]?.constraints) {
            errorMsg = Object.values(exception.children[0].constraints);
        }

        // Create a new BadRequestException with the validation error message.
        const err = BadRequestException.VALIDATION_ERROR(
            Object.values(errorMsg)[0]
        );


        const responseBody: ErrorResponse = {
            success: false,
            statusCode: httpStatus,
            data: {
                error: errorMsg,
            },
            message: err.message,
            timestamp: format(new Date(), 'yyyy-MM-dd hh:mm:ss a'),
        };

        // Uses the HTTP adapter to send the response with the constructed response body
        // and the HTTP status code.
        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
