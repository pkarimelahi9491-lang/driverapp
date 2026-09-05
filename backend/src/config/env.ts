import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Database (for Prisma - connects to Supabase PostgreSQL)
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Legacy JWT (kept for backward compatibility)
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  defaultPrimaryOrigin: 'انبار مرکزی انتخاب (مورچه خورت)',
} as const;
