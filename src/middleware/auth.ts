import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// اضافه کردن فیلد user به Request پیش‌فرض Express برای حل خطای Property user does not exist
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: any = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

export interface AuthRequest extends Request {
  user?: any;
}

// میدلور احراز هویت (هم با نام authenticate و هم authenticateToken)
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const authenticateToken = authenticate;

// میدلور دسترسی نقش‌ها (هم با نام authorize و هم requireRole)
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};

export const requireRole = authorize;

export async function createSupabaseUser(
  email: string,
  password: string,
  userData: { username: string; role: string }
): Promise<{ id: string; email: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Supabase admin client not initialized');
      return null;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: userData.username,
        role: userData.role,
      },
    });

    if (error || !data.user) {
      console.error('Failed to create Supabase user:', error);
      return null;
    }

    return { id: data.user.id, email: data.user.email ?? email };
  } catch (error) {
    console.error('Supabase user creation failed:', error);
    return null;
  }
}

export function generateToken(payload: object): string {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}
