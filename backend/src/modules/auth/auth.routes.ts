import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import {
  generateToken,
  createSupabaseUser,
} from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { AppError } from '../../middleware/AppError';
import { authenticate } from '../../middleware/auth';
import { getJalaliDateTimeString } from '../../utils/persianDate';
import { config } from '../../config/env';

const router = Router();

/**
 * POST /api/auth/login
 * Login using PostgreSQL User table + bcrypt
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw AppError.badRequest(
        'نام کاربری و رمز عبور الزامی است'
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw AppError.unauthorized(
        'نام کاربری یا رمز عبور اشتباه است'
      );
    }

    if (!user.isActive) {
      throw AppError.forbidden(
        'حساب کاربری شما غیرفعال شده است'
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw AppError.unauthorized(
        'نام کاربری یا رمز عبور اشتباه است'
      );
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        operatorName: user.username,
        operatorRole: user.role,
        action: 'LOGIN',
        entityTitle: 'ورود به سیستم',
        details:
          'ورود موفق کاربر ' +
          user.username +
          ' با نقش ' +
          user.role,
        jalaliTimestamp: getJalaliDateTimeString(),
      },
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  })
);

/**
 * POST /api/auth/register
 * Register new user (Admin only)
 */
router.post(
  '/register',
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user?.role !== 'ADMIN') {
      throw AppError.forbidden(
        'فقط مدیر سیستم می‌تواند کاربر جدید ایجاد کند'
      );
    }

    const { username, password, role } = req.body;

    if (!username || !password) {
      throw AppError.badRequest(
        'نام کاربری و رمز عبور الزامی است'
      );
    }

    if (password.length < 6) {
      throw AppError.badRequest(
        'رمز عبور باید حداقل ۶ کاراکتر باشد'
      );
    }

    const validRoles = [
      'DRIVER',
      'ADMIN',
      'FINANCE',
    ];

    const userRole = validRoles.includes(role)
      ? role
      : 'DRIVER';

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw AppError.conflict(
        'نام کاربری تکراری است'
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    let supabaseUserId: string | null = null;

    if (
      config.supabaseUrl &&
      config.supabaseServiceRoleKey
    ) {
      const email =
        username + '@arman-fleet.local';

      const supabaseUser =
        await createSupabaseUser(
          email,
          password,
          {
            username,
            role: userRole,
          }
        );

      if (supabaseUser) {
        supabaseUserId = supabaseUser.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        id: supabaseUserId || undefined,
        username,
        passwordHash,
        role: userRole,
      },
    });

    const auditDetails =
      'ایجاد کاربر ' +
      username +
      ' با نقش ' +
      userRole +
      (supabaseUserId
        ? ' (Supabase Auth)'
        : '');

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        operatorName: req.user.username,
        operatorRole: req.user.role,
        action: 'CREATE_USER',
        entityTitle:
          'کاربر جدید: ' + username,
        details: auditDetails,
        jalaliTimestamp:
          getJalaliDateTimeString(),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  })
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { driver: true },
    });

    if (!user) {
      throw AppError.notFound(
        'کاربر یافت نشد'
      );
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        driver: user.driver
          ? {
              id: user.driver.id,
              fullName:
                user.driver.fullName,
              driverCode:
                user.driver.driverCode,
              personnelCode:
                user.driver.personnelCode,
              phoneNumber:
                user.driver.phoneNumber,
              carModel:
                user.driver.carModel,
              carPlate:
                user.driver.carPlate,
            }
          : null,
      },
    });
  })
);

export default router;
