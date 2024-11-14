import { type ExceptionFilter, Catch, type ArgumentsHost, Logger, } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/response.interfaces';
import { format } from 'date-fns';

@Catch()
export class ErrorFilter implements ExceptionFilter {

    private readonly logger = new Logger(ErrorFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        this.logger.error(exception);

        console.log("exception", exception);

        let message = exception.response?.message || null;

        if (!message) {
            message = exception.response;
        }

        if (!message) {
            message = exception.message;
        }

        // convert all message to array
        if (typeof message === 'string') {
            message = [message];
        }

        if (exception.status === 429) {
            message = 'Too many requests';
        }
        const errorResponse: ErrorResponse = {
            statusCode: exception.status || 500,
            success: false,
            data: {
                error: exception.response?.error,
            },
            message: message,
            timestamp: format(new Date(), 'yyyy-MM-dd hh:mm:ss a'),
        };
        // console.log("errorResponse", errorResponse);
        response.status(exception.status || 500).json(errorResponse);
    }
}


