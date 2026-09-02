import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './AppError';

export const auth = (...allowedRoles: (string | string[])[]) => {
  const flattenedRoles = allowedRoles.flat();

  return (req: any, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(AppError.unauthorized('توکن احراز هویت یافت نشد'));
      }

      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'secret-key';
      const decoded: any = jwt.verify(token, secret);

      req.user = decoded;

      if (flattenedRoles.length > 0) {
        const userRole = decoded.role || (decoded.user && decoded.user.role);
        if (!userRole || !flattenedRoles.includes(userRole)) {
          return next(AppError.forbidden('شما دسترسی لازم برای این عملیات را ندارید'));
        }
      }

      next();
    } catch (err) {
      return next(AppError.unauthorized('توکن نامعتبر یا منقضی شده است'));
    }
  };
};

export const authorize = auth;
export default auth;
