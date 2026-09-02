import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './AppError';
import prisma from '../config/database';
import { getSupabaseAdmin } from '../config/supabase';

export interface AuthPayload {
  userId: string;
  username: string;
  role: string;
  driverId?: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Verify Supabase JWT token
 * Supabase JWTs contain: sub (user id), role, email, etc.
 */
async function verifySupabaseToken(token: string): Promise<AuthPayload | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Use Supabase to verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile from our users table
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { driver: true },
    });

    if (!userProfile || !userProfile.isActive) {
      return null;
    }

    return {
      userId: userProfile.id,
      username: userProfile.username,
      role: userProfile.role,
      driverId: userProfile.driver?.id,
    };
  } catch (error) {
    console.error('Supabase token verification failed:', error);
    return null;
  }
}

/**
 * Verify legacy JWT token (for backward compatibility)
 */
function verifyLegacyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 * Supports both Supabase Auth and legacy JWT tokens
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('توکن احراز هویت ارسال نشده است');
    }

    const token = authHeader.split(' ')[1];
    let authPayload: AuthPayload | null = null;

    // Try Supabase Auth first
    if (config.supabaseUrl && config.supabaseAnonKey) {
      authPayload = await verifySupabaseToken(token);
    }

    // Fall back to legacy JWT if Supabase verification failed
    if (!authPayload) {
      authPayload = verifyLegacyToken(token);
    }

    if (!authPayload) {
      throw AppError.unauthorized('توکن نامعتبر یا منقضی شده است');
    }

    // Verify user still exists and is active (for legacy tokens)
    const user = await prisma.user.findUnique({ where: { id: authPayload.userId } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('کاربر غیرفعال یا حذف شده است');
    }

    req.user = authPayload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(AppError.unauthorized('توکن نامعتبر یا منقضی شده است'));
    }
  }
}

/**
 * Middleware factory for role-based access control
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden(`شما اجازه انجام این عملیات را ندارید. نقش مجاز: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Generate legacy JWT token (for backward compatibility)
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' } as any)
}

/**
 * Create Supabase Auth user (for admin operations)
 */
export async function createSupabaseUser(
  email: string,
  password: string,
  userData: { username: string; role: string }
): Promise<{ id: string; email: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation for admin-created users
      user_metadata: {
        username: userData.username,
        role: userData.role,
      },
    });

    if (error) {
      console.error('Failed to create Supabase user:', error);
      return null;
    }

    return { id: data.user.id, email: data.user.email || email };
  } catch (error) {
    console.error('Supabase user creation failed:', error);
    return null;
  }
}

/**
 * Delete Supabase Auth user
 */
export async function deleteSupabaseUser(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    return !error;
  } catch (error) {
    console.error('Supabase user deletion failed:', error);
    return false;
  }
}
