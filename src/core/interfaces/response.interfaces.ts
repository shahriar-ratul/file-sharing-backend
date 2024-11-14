
import { HttpStatus } from '@nestjs/common';

export interface IResponseMetadata {
    statusCode?: HttpStatus;
    message?: string;
}

export interface IResponse {
    _metadata?: IResponseMetadata;
    _data?: Record<string, any>;
}

export interface IResponsePaging {
    _metadata?: IResponseMetadata;
    _pagination: IResponsePagingPagination;
    _data: Record<string, any>[];
}

export interface IResponsePagingPagination {
    totalPage: number;
    total: number;
}

export interface ErrorResponse {
    success: boolean;
    statusCode: number;
    description?: string;
    timestamp: string;
    data?: any;
    message?: string;
}


export interface IException {
    success: boolean;
    message: string;
    statusCode: number;
    cause?: Error;
    description?: string;
}

