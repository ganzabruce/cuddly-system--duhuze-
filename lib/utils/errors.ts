export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed", code = "VALIDATION_ERROR") {
        super(400, message, code);
        this.name = "ValidationError";
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found", code = "NOT_FOUND") {
        super(404, message, code);
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
        super(401, message, code);
        this.name = "UnauthorizedError";
    }
}

export class CapacityExceededError extends Error {
    constructor() {
        super("Event is at capacity");
        this.name = "CapacityExceededError";
    }
}

