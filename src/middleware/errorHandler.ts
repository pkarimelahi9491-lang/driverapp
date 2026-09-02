import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] || 'فیلد';
      res.status(409).json({
        success: false,
        error: {
          message: `مقدار تکراری برای ${field} وارد شده است`,
          statusCode: 409,
        },
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'رکورد مورد نظر یافت نشد',
          statusCode: 404,
        },
      });
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'توکن نامعتبر است',
        statusCode: 401,
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'توکن منقضی شده است',
        statusCode: 401,
      },
    });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'development' ? err.message : 'خطای داخلی سرور',
      statusCode: 500,
    },
  });
}
