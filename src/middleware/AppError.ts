export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'درخواست نامعتبر است'): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'عدم احراز هویت'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'عدم دسترسی مجاز'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'موردی یافت نشد'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message = 'تداخل در داده‌ها رخ داده است'): AppError {
    return new AppError(message, 409);
  }

  static internal(message = 'خطای داخلی سرور'): AppError {
    return new AppError(message, 500);
  }
}

export default AppError;
