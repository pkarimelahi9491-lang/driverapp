/**
 * ═══════════════════════════════════════════════════════════════════
 * Arman Fleet - Supabase Auth Seed Script
 * Creates users in Supabase Auth + public.users + drivers
 * 
 * Run AFTER SQL migrations (001-004)
 * 
 * Usage:
 *   npx ts-node supabase/seed_auth.ts
 * 
 * Required env vars:
 *   SUPABASE_URL — Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service Role key (NEVER commit this!)
 * ═══════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ═══════════════════════════════════════════════════════════════════
// User definitions
// ═══════════════════════════════════════════════════════════════════

interface SeedUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'FINANCE' | 'DRIVER';
  fullName?: string;
  driverCode?: string;
  personnelCode?: string;
  phoneNumber?: string;
  nationalId?: string;
  carModel?: string;
  carPlate?: string;
  joinDateJalali?: string;
  description?: string;
}

const USERS: SeedUser[] = [
  {
    email: 'admin@arman-fleet.local',
    password: 'admin123',
    role: 'ADMIN',
  },
  {
    email: 'malimedia@arman-fleet.local',
    password: 'admin123',
    role: 'FINANCE',
  },
  {
    email: 'd101@arman-fleet.local',
    password: 'driver123',
    role: 'DRIVER',
    fullName: 'علی رضایی',
    driverCode: 'AR-101',
    personnelCode: 'EMP-101',
    phoneNumber: '09120000001',
    nationalId: '0010010001',
    carModel: 'پژو 206',
    carPlate: '12 الف 345',
    joinDateJalali: '1402/01/01',
  },
  {
    email: 'd102@arman-fleet.local',
    password: 'driver123',
    role: 'DRIVER',
    fullName: 'رضا محمدی',
    driverCode: 'AR-102',
    personnelCode: 'EMP-102',
    phoneNumber: '09120000002',
    nationalId: '0010010002',
    carModel: 'پژو 405',
    carPlate: '22 ب 567',
    joinDateJalali: '1402/02/15',
  },
  {
    email: 'd103@arman-fleet.local',
    password: 'driver123',
    role: 'DRIVER',
    fullName: 'حسین کریمی',
    driverCode: 'AR-103',
    personnelCode: 'EMP-103',
    phoneNumber: '09120000003',
    nationalId: '0010010003',
    carModel: 'سمند',
    carPlate: '33 ج 789',
    joinDateJalali: '1402/03/01',
  },
  {
    email: 'd104@arman-fleet.local',
    password: 'driver123',
    role: 'DRIVER',
    fullName: 'محمد احمدی',
    driverCode: 'AR-104',
    personnelCode: 'EMP-104',
    phoneNumber: '09120000004',
    nationalId: '0010010004',
    carModel: 'پراید',
    carPlate: '44 د 012',
    joinDateJalali: '1402/04/10',
  },
  {
    email: 'd105@arman-fleet.local',
    password: 'driver123',
    role: 'DRIVER',
    fullName: 'مهدی کاظمی',
    driverCode: 'AR-105',
    personnelCode: 'EMP-105',
    phoneNumber: '09120000005',
    nationalId: '0010010005',
    carModel: 'پژو پارس',
    carPlate: '55 ه 345',
    joinDateJalali: '1402/05/20',
    description: 'غیرفعال — در حال استراحت',
  },
];

// ═══════════════════════════════════════════════════════════════════
// Seed function
// ═══════════════════════════════════════════════════════════════════

async function seedUsers() {
  console.log('🚀 Starting Supabase Auth seed...\n');

  for (const user of USERS) {
    console.log(`📧 Creating: ${user.email} (${user.role})`);

    // 1. Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      app_metadata: {
        role: user.role,
      },
      user_metadata: {
        full_name: user.fullName || user.email,
      },
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        console.log(`   ⏭️  Already exists, skipping auth creation`);

        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email === user.email);

        if (existing) {
          await insertPublicUser(existing.id, user);
        }
      } else {
        console.error(`   ❌ Auth error: ${authError.message}`);
      }
      continue;
    }

    const authUserId = authData?.user?.id;
    if (!authUserId) {
      console.error(`   ❌ No auth user ID returned`);
      continue;
    }

    console.log(`   ✅ Auth user created: ${authUserId}`);

    // 2. Insert into public.users
    await insertPublicUser(authUserId, user);
  }

  console.log('\n✅ Seed completed!');
  console.log('\n📋 Login credentials:');
  console.log('┌─────────────────────────────────┬─────────────┬──────────┐');
  console.log('│ Username (for login)            │ Password    │ Role     │');
  console.log('├─────────────────────────────────┼─────────────┼──────────┤');
  for (const u of USERS) {
    const username = u.email.split('@')[0];
    console.log(`│ ${username.padEnd(31)} │ ${u.password.padEnd(11)} │ ${u.role.padEnd(8)} │`);
  }
  console.log('└─────────────────────────────────┴─────────────┴──────────┘');
  console.log('\n⚠️  Backend auth converts email to username format:');
  console.log('   Example: d101@arman-fleet.local → login with username "d101"');
}

async function insertPublicUser(authUserId: string, user: SeedUser) {
  const username = user.email.split('@')[0];

  const { error: userError } = await supabase
    .from('users')
    .upsert(
      {
        id: authUserId,
        username: username,
        password_hash: 'managed_by_supabase_auth',
        role: user.role,
        is_active: true,
      },
      { onConflict: 'id' }
    );

  if (userError) {
    console.error(`   ❌ public.users error: ${userError.message}`);
    return;
  }

  console.log(`   ✅ public.users record created (username: ${username})`);

  // If driver, create driver record
  if (user.role === 'DRIVER' && user.fullName) {
    const { error: driverError } = await supabase
      .from('drivers')
      .upsert(
        {
          user_id: authUserId,
          full_name: user.fullName,
          driver_code: user.driverCode,
          personnel_code: user.personnelCode,
          phone_number: user.phoneNumber,
          national_id: user.nationalId,
          car_model: user.carModel,
          car_plate: user.carPlate,
          join_date_jalali: user.joinDateJalali,
          is_active: !user.description?.includes('غیرفعال'),
          description: user.description || '',
        },
        { onConflict: 'user_id' }
      );

    if (driverError) {
      console.error(`   ❌ drivers error: ${driverError.message}`);
    } else {
      console.log(`   ✅ Driver record created: ${user.fullName} (${user.driverCode})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Run
// ═══════════════════════════════════════════════════════════════════

seedUsers().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
