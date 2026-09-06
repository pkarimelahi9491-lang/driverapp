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
import {
  getSupabasePublic,
  getSupabaseAdmin,
} from '../../config/supabase';

const router = Router();

/**
 * POST /api/auth/login
 *
 * Login using:
 * 1. Supabase Auth
 * 2. Fallback to Prisma + bcrypt
 *
 * Supabase users in this project may have been created with:
 * admin
 * d101
 * d102
 * ...
 *
 * instead of:
 * admin@arman-fleet.local
 *
 * Therefore we first find the real Supabase Auth user
 * and then authenticate using the actual email stored in Auth.
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const username = String(
      req.body?.username || ''
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body?.password || ''
    );

    if (!username || !password) {
      throw AppError.badRequest(
        'نام کاربری و رمز عبور الزامی است'
      );
    }

    let user = null;
    let token: string | null = null;

    /**
     * ============================================================
     * 1. Try Supabase Auth
     * ============================================================
     *
     * We do NOT assume:
     *
     * username@arman-fleet.local
     *
     * because the existing Supabase users were created with
     * usernames such as "admin", "d101", etc.
     */
    if (
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      config.supabaseServiceRoleKey
    ) {
      try {
        const supabaseAdmin =
          getSupabaseAdmin();

        /**
         * Find the real Supabase Auth user.
         *
         * We search by the actual email stored in Supabase.
         * The existing project has users whose Auth email is
         * simply "admin", "d101", etc.
         */
        let authUser = null;

        const {
          data: usersData,
          error: usersError,
        } =
          await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });

        if (!usersError && usersData?.users) {
          authUser =
            usersData.users.find(
              (authUser) =>
                String(authUser.email || '')
                  .trim()
                  .toLowerCase() === username
            );
        }

        /**
         * If an exact username was not found,
         * also try the old project email convention.
         *
         * This keeps compatibility with users created later
         * using username@arman-fleet.local.
         */
        if (!authUser) {
          const legacyEmail =
            `${username}@arman-fleet.local`;

          authUser =
            usersData?.users?.find(
              (item) =>
                String(item.email || '')
                  .trim()
                  .toLowerCase() ===
                legacyEmail.toLowerCase()
            ) || null;
        }

        /**
         * Authenticate against the actual Supabase email.
         */
        if (authUser?.email) {
          const supabase =
            getSupabasePublic();

          const {
            data,
            error,
          } =
            await supabase.auth.signInWithPassword({
              email: authUser.email,
              password,
            });

          if (
            !error &&
            data.user &&
            data.session?.access_token
          ) {
            token =
              data.session.access_token;

            /**
             * IMPORTANT:
             *
             * Supabase Auth UID must match
             * public.users.id.
             */
            user =
              await prisma.user.findUnique({
                where: {
                  id: data.user.id,
                },
                include: {
                  driver: true,
                },
              });
          }
        }
      } catch (error) {
        console.warn(
          'Supabase authentication failed:',
          error
        );
      }
    }

    /**
     * ============================================================
     * 2. Fallback to old Prisma + bcrypt authentication
     * ============================================================
     *
     * This keeps compatibility with users such as "parisa"
     * that have a real bcrypt/argon2-style password hash
     * in public.users.
     */
    if (!user || !token) {
      user =
        await prisma.user.findUnique({
          where: {
            username,
          },
          include: {
            driver: true,
          },
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

      /**
       * Users managed by Supabase do not have
       * a bcrypt password in this column.
       *
       * Therefore do not try bcrypt against:
       *
       * managed_by_supabase_auth
       */
      if (
        user.passwordHash ===
        'managed_by_supabase_auth'
      ) {
        throw AppError.unauthorized(
          'نام کاربری یا رمز عبور اشتباه است'
        );
      }

      const isPasswordValid =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!isPasswordValid) {
        throw AppError.unauthorized(
          'نام کاربری یا رمز عبور اشتباه است'
        );
      }

      token =
        generateToken({
          userId: user.id,
          username: user.username,
          role: user.role,
        });
    }

    /**
     * ============================================================
     * 3. Check account status
     * ============================================================
     */
    if (!user.isActive) {
      throw AppError.forbidden(
        'حساب کاربری شما غیرفعال شده است'
      );
    }

    /**
     * ============================================================
     * 4. Audit log
     * ============================================================
     */
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
        jalaliTimestamp:
          getJalaliDateTimeString(),
      },
    });

    /**
     * ============================================================
     * 5. Response
     * ============================================================
     */
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

    const {
      username,
      password,
      role,
    } = req.body;

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

    const userRole =
      validRoles.includes(role)
        ? role
        : 'DRIVER';

    const existingUser =
      await prisma.user.findUnique({
        where: { username },
      });

    if (existingUser) {
      throw AppError.conflict(
        'نام کاربری تکراری است'
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    let supabaseUserId: string | null =
      null;

    /**
     * Create user in Supabase Auth when possible.
     *
     * New users continue to use the project's
     * standard email convention.
     */
    if (
      config.supabaseUrl &&
      config.supabaseServiceRoleKey
    ) {
      const email =
        username +
        '@arman-fleet.local';

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
        supabaseUserId =
          supabaseUser.id;
      }
    }

    const user =
      await prisma.user.create({
        data: {
          id:
            supabaseUserId ||
            undefined,
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
        operatorName:
          req.user.username,
        operatorRole: req.user.role,
        action: 'CREATE_USER',
        entityTitle:
          'کاربر جدید: ' +
          username,
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
    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user!.userId,
        },
        include: {
          driver: true,
        },
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
                user.driver
                  .personnelCode,
              phoneNumber:
                user.driver
                  .phoneNumber,
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
