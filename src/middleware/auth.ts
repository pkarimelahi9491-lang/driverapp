import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-it';

export interface AuthenticatedUser {
  id: string;
  nationalCode?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware احراز هویت و بررسی نقش‌ها
 */
export const authenticate = (roles?: string | string[] | any, ...extraRoles: any[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(AppError.unauthorized('توکن احراز هویت ارسال نشده است'));
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return next(AppError.unauthorized('توکن معتبر نمی‌باشد'));
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return next(AppError.unauthorized('توکن منقضی شده یا نامعتبر است'));
      }

      req.user = decoded;

      // بررسی نقش‌ها
      if (roles) {
        let allowedRoles: string[] = [];
        if (typeof roles === 'string') {
          allowedRoles = [roles, ...extraRoles];
        } else if (Array.isArray(roles)) {
          allowedRoles = [...roles, ...extraRoles];
        }

        if (allowedRoles.length > 0 && req.user && req.user.role) {
          if (!allowedRoles.includes(req.user.role)) {
            return next(AppError.forbidden('شما دسترسی لازم برای این عملیات را ندارید'));
          }
        }
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * تولید توکن JWT
 */
export const generateToken = (payload: object, expiresIn: string | number = '7d'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
};

/**
 * ایجاد یا شبیه‌سازی کاربر در Supabase با پشتیبانی از چند آرگومان
 */
export const createSupabaseUser = async (arg1?: any, arg2?: any, arg3?: any, ...rest: any[]): Promise<any> => {
  if (typeof arg1 === 'object' && arg1 !== null) {
    return {
      id: arg1.id || 'generated-user-id',
      ...arg1,
      createdAt: new Date().toISOString()
    };
  }

  return {
    id: 'generated-user-id',
    email: arg1,
    password: arg2,
    metadata: arg3,
    createdAt: new Date().toISOString()
  };
};

export const requireRole = authenticate;
export const authorize = authenticate;

export default {
  authenticate,
  generateToken,
  createSupabaseUser,
  requireRole,
  authorize
};
