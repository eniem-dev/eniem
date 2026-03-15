export class ServerError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

export class UnauthorizedError extends ServerError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends ServerError {
  constructor(message: string = 'Not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServerError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}