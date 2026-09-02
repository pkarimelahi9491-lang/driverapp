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
 * قابل فراخوانی به صورت authenticate() یا authenticate('ADMIN') یا authenticate(['ADMIN', 'DISPATCHER'])
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

      // بررسی نقش‌ها (در صورتی که نقشی مشخص شده باشد)
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
 * شبیه‌سازی یا ایجاد کاربر در Supabase
 */
export const createSupabaseUser = async (userData: any): Promise<any> => {
  return {
    id: userData.id || 'generated-user-id',
    ...userData,
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
