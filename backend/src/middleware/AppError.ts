/**
 * Custom Application Error class with HTTP status codes
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string) {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = 'احراز هویت نامعتبر است') {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'شما اجازه انجام این عملیات را ندارید') {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'مورد مورد نظر یافت نشد') {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static internal(message: string = 'خطای داخلی سرور') {
    return new AppError(message, 500, false);
  }
}
