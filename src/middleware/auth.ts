import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

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

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};

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
