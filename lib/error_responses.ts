/**
 * Centralized error response definitions
 * All error codes used throughout the API should be defined here
 */

interface ErrorResponse {
    alias: string;
    code: number;
    message: string;
    trace?: any; // Only included when APP_DEBUG=true
}

export interface ApiSuccessResponse<T = any> {
    status: 'ok';
    data: T;
}

export interface ApiErrorResponse {
    status: 'error';
    data: ErrorResponse;
}

type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error definitions
export const ERRORS = {
    // Authentication & Authorization (4xx)
    UNAUTHORIZED: {
        alias: 'UNAUTHORIZED',
        code: 401,
        message: 'Unauthorized',
    },
    FORBIDDEN: {
        alias: 'FORBIDDEN',
        code: 403,
        message: 'Forbidden',
    },
    INVALID_CREDENTIALS: {
        alias: 'INVALID_CREDENTIALS',
        code: 401,
        message: 'Invalid email or password',
    },

    // Not Found (404)
    USER_NOT_FOUND: {
        alias: 'USER_NOT_FOUND',
        code: 404,
        message: 'User not found',
    },
    ROLE_NOT_FOUND: {
        alias: 'ROLE_NOT_FOUND',
        code: 404,
        message: 'Role not found',
    },
    FILE_NOT_FOUND: {
        alias: 'FILE_NOT_FOUND',
        code: 404,
        message: 'File not found',
    },
    FOLDER_NOT_FOUND: {
        alias: 'FOLDER_NOT_FOUND',
        code: 404,
        message: 'Folder not found',
    },
    PERMISSION_NOT_FOUND: {
        alias: 'PERMISSION_NOT_FOUND',
        code: 404,
        message: 'Permission not found',
    },

    // Validation Errors (400)
    VALIDATION_ERROR: {
        alias: 'VALIDATION_ERROR',
        code: 400,
        message: 'Validation error',
    },
    MISSING_REQUIRED_FIELDS: {
        alias: 'MISSING_REQUIRED_FIELDS',
        code: 400,
        message: 'Missing required fields',
    },
    INVALID_INPUT: {
        alias: 'INVALID_INPUT',
        code: 400,
        message: 'Invalid input',
    },
    FILE_SIZE_EXCEEDED: {
        alias: 'FILE_SIZE_EXCEEDED',
        code: 400,
        message: 'File size exceeds maximum allowed',
    },
    INVALID_FILE_TYPE: {
        alias: 'INVALID_FILE_TYPE',
        code: 400,
        message: 'Type must be "file" or "folder"',
    },

    // Conflict Errors (409)
    USER_ALREADY_EXISTS: {
        alias: 'USER_ALREADY_EXISTS',
        code: 409,
        message: 'User with this email already exists',
    },
    ROLE_ALREADY_EXISTS: {
        alias: 'ROLE_ALREADY_EXISTS',
        code: 409,
        message: 'Role with this name already exists',
    },
    EMAIL_ALREADY_EXISTS: {
        alias: 'EMAIL_ALREADY_EXISTS',
        code: 409,
        message: 'Email already exists',
    },

    // Forbidden Actions (403)
    CANNOT_MODIFY_SYSTEM_ACCOUNT: {
        alias: 'CANNOT_MODIFY_SYSTEM_ACCOUNT',
        code: 403,
        message: 'Cannot modify system accounts',
    },
    CANNOT_DELETE_SYSTEM_ACCOUNT: {
        alias: 'CANNOT_DELETE_SYSTEM_ACCOUNT',
        code: 403,
        message: 'Cannot delete system accounts',
    },

    // Server Errors (500)
    INTERNAL_SERVER_ERROR: {
        alias: 'INTERNAL_SERVER_ERROR',
        code: 500,
        message: 'Internal server error',
    },
    FAILED_TO_CREATE_USER: {
        alias: 'FAILED_TO_CREATE_USER',
        code: 500,
        message: 'Failed to create user',
    },
    FAILED_TO_UPDATE_USER: {
        alias: 'FAILED_TO_UPDATE_USER',
        code: 500,
        message: 'Failed to update user',
    },
    FAILED_TO_CREATE_FILE: {
        alias: 'FAILED_TO_CREATE_FILE',
        code: 500,
        message: 'Failed to create file record',
    },
    FAILED_TO_CREATE_FOLDER: {
        alias: 'FAILED_TO_CREATE_FOLDER',
        code: 500,
        message: 'Failed to create folder',
    },
    FAILED_TO_UPDATE_FILE: {
        alias: 'FAILED_TO_UPDATE_FILE',
        code: 500,
        message: 'Failed to update file',
    },
    FAILED_TO_DELETE_FILE: {
        alias: 'FAILED_TO_DELETE_FILE',
        code: 500,
        message: 'Failed to delete file',
    },
    FAILED_TO_UPLOAD_FILE: {
        alias: 'FAILED_TO_UPLOAD_FILE',
        code: 500,
        message: 'Failed to upload file',
    },
    PARENT_FOLDER_NOT_FOUND: {
        alias: 'PARENT_FOLDER_NOT_FOUND',
        code: 400,
        message: 'Parent folder not found',
    },
    PARENT_MUST_BE_FOLDER: {
        alias: 'PARENT_MUST_BE_FOLDER',
        code: 400,
        message: 'Parent must be a folder',
    },
    FILE_REQUIRED: {
        alias: 'FILE_REQUIRED',
        code: 400,
        message: 'File is required',
    },
    NOT_A_FOLDER: {
        alias: 'NOT_A_FOLDER',
        code: 400,
        message: 'Item is not a folder',
    },
    CANNOT_DOWNLOAD_FOLDER: {
        alias: 'CANNOT_DOWNLOAD_FOLDER',
        code: 400,
        message: 'Cannot download folder',
    },
    FILE_STORAGE_INFO_UNAVAILABLE: {
        alias: 'FILE_STORAGE_INFO_UNAVAILABLE',
        code: 500,
        message: 'File storage information not available',
    },
    INVALID_PERMISSION_FORMAT: {
        alias: 'INVALID_PERMISSION_FORMAT',
        code: 400,
        message: 'Invalid permission format',
    },
    ROLE_NAME_REQUIRED: {
        alias: 'ROLE_NAME_REQUIRED',
        code: 400,
        message: 'Role name is required',
    },
    FAILED_TO_CREATE_ROLE: {
        alias: 'FAILED_TO_CREATE_ROLE',
        code: 500,
        message: 'Failed to create role',
    },
    FAILED_TO_UPDATE_ROLE: {
        alias: 'FAILED_TO_UPDATE_ROLE',
        code: 500,
        message: 'Failed to update role',
    },
    FAILED_TO_DELETE_ROLE: {
        alias: 'FAILED_TO_DELETE_ROLE',
        code: 500,
        message: 'Failed to delete role',
    },
    ROLE_ID_REQUIRED: {
        alias: 'ROLE_ID_REQUIRED',
        code: 400,
        message: 'Role ID is required',
    },
    PERMISSION_ID_REQUIRED: {
        alias: 'PERMISSION_ID_REQUIRED',
        code: 400,
        message: 'Permission ID is required',
    },
    CANNOT_MODIFY_ROLES_FOR_SYSTEM_ACCOUNT: {
        alias: 'CANNOT_MODIFY_ROLES_FOR_SYSTEM_ACCOUNT',
        code: 403,
        message: 'Cannot modify roles for system accounts',
    },
    CANNOT_MODIFY_PERMISSIONS_FOR_SYSTEM_ACCOUNT: {
        alias: 'CANNOT_MODIFY_PERMISSIONS_FOR_SYSTEM_ACCOUNT',
        code: 403,
        message: 'Cannot modify permissions for system accounts',
    },
} as const;

// Helper function to create success response
export function successResponse<T>(data: T): ApiSuccessResponse<T> {
    return {
        status: 'ok',
        data,
    };
}

// Helper function to create error response
export const errorResponse = (
    errorDef: typeof ERRORS[keyof typeof ERRORS],
    customMessage?: string,
    trace?: any
): ApiErrorResponse => {
    const isDebug = process.env.APP_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

    const response: ApiErrorResponse = {
        status: 'error',
        data: {
            alias: errorDef.alias,
            code: errorDef.code,
            message: customMessage || errorDef.message,
        },
    };

    // Only include trace in debug mode
    if (isDebug && trace) {
        response.data.trace = trace;
    }

    return response;
};

// Helper function to create custom error response
export const customErrorResponse = (
    alias: string,
    code: number,
    message: string,
    trace?: any
): ApiErrorResponse => {
    const isDebug = process.env.APP_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

    const response: ApiErrorResponse = {
        status: 'error',
        data: {
            alias,
            code,
            message,
        },
    };

    if (isDebug && trace) {
        response.data.trace = trace;
    }

    return response;
};

// NextResponse helpers (for API route handlers)
import { NextResponse } from 'next/server';

export const createSuccessResponse = <T>(data: T, init?: ResponseInit): NextResponse<ApiSuccessResponse<T>> => {
    return NextResponse.json(successResponse(data), init);
};

export const createErrorResponse = (
    errorDef: typeof ERRORS[keyof typeof ERRORS],
    customMessage?: string,
    trace?: any
): NextResponse<ApiErrorResponse> => {
    const errorResp = errorResponse(errorDef, customMessage, trace);
    return NextResponse.json(errorResp, { status: errorResp.data.code });
};

export const createCustomErrorResponse = (
    alias: string,
    code: number,
    message: string,
    trace?: any
): NextResponse<ApiErrorResponse> => {
    const errorResp = customErrorResponse(alias, code, message, trace);
    return NextResponse.json(errorResp, { status: code });
};

