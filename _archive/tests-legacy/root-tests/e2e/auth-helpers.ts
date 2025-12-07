/**
 * Authentication Helpers for E2E Tests
 * 
 * Provides utilities for authenticating as different roles during Playwright tests.
 * These helpers manage Supabase authentication and ensure proper session handling.
 */

import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables for E2E tests');
}

/**
 * Test users configuration
 * These users should be created manually in Supabase Dashboard or via setup script
 * See docs/setup/TEST_USERS_SETUP.md for instructions
 */
export const TEST_USERS = {
  admin: {
    email: 'test-admin@tecnicocursos.local',
    password: 'Admin@Test2024!',
    role: 'admin',
  },
  editor: {
    email: 'test-editor@tecnicocursos.local',
    password: 'Editor@Test2024!',
    role: 'editor',
  },
  viewer: {
    email: 'test-viewer@tecnicocursos.local',
    password: 'Viewer@Test2024!',
    role: 'viewer',
  },
  moderator: {
    email: 'test-moderator@tecnicocursos.local',
    password: 'Moderator@Test2024!',
    role: 'moderator',
  },
} as const;

/**
 * Create test users if they don't exist
 * Should be run in test setup (e.g., global-setup.ts)
 */
export async function setupTestUsers() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - skipping test user setup');
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const [roleName, userData] of Object.entries(TEST_USERS)) {
    try {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users.some((u) => u.email === userData.email);

      if (!userExists) {
        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            role: userData.role,
            name: `Test ${roleName.charAt(0).toUpperCase() + roleName.slice(1)}`,
          },
        });

        if (createError) {
          console.error(`Failed to create ${roleName} user:`, createError.message);
          continue;
        }

        console.log(`✅ Created test user: ${userData.email} (${userData.role})`);

        // Assign role via user_roles table (if using RBAC schema)
        if (newUser?.user?.id) {
          const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
            user_id: newUser.user.id,
            role_name: userData.role,
          });

          if (roleError) {
            console.warn(`⚠️  Failed to assign role ${userData.role} to user:`, roleError.message);
          } else {
            console.log(`✅ Assigned role ${userData.role} to ${userData.email}`);
          }
        }
      } else {
        console.log(`ℹ️  Test user already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Error setting up ${roleName} user:`, error);
    }
  }
}

/**
 * Login as a specific user and inject the session into the Playwright page
 */
async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to login as ${email}: ${error.message}`);
  }

  if (!data.session) {
    throw new Error(`No session returned for ${email}`);
  }

  // Navigate to the app first (if not already there)
  const currentUrl = page.url();
  if (!currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1')) {
    await page.goto('http://localhost:3000');
  }

  // Inject the session into localStorage/cookies
  await page.evaluate(
    ({ session }) => {
      // Set Supabase session in localStorage (default auth storage)
      localStorage.setItem(
        'sb-' + window.location.hostname.split('.')[0] + '-auth-token',
        JSON.stringify(session)
      );
    },
    { session: data.session }
  );

  // Reload to apply the session
  await page.reload();

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');

  console.log(`✅ Logged in as: ${email}`);
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
}

/**
 * Login as editor user
 */
export async function loginAsEditor(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.editor.email, TEST_USERS.editor.password);
}

/**
 * Login as viewer user
 */
export async function loginAsViewer(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.viewer.email, TEST_USERS.viewer.password);
}

/**
 * Login as moderator user
 */
export async function loginAsModerator(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.moderator.email, TEST_USERS.moderator.password);
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Clear storage in the browser
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Navigate to home or login page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('✅ Logged out');
}

/**
 * Check if user is authenticated by inspecting the page
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const hasSession = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    return keys.some((key) => key.includes('auth-token'));
  });

  return hasSession;
}

/**
 * Get current user info from the page
 */
export async function getCurrentUser(page: Page): Promise<{ email: string; role?: string } | null> {
  return page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const authKey = keys.find((key) => key.includes('auth-token'));

    if (!authKey) {
      return null;
    }

    try {
      const sessionData = JSON.parse(localStorage.getItem(authKey) || '{}');
      return {
        email: sessionData.user?.email || null,
        role: sessionData.user?.user_metadata?.role || null,
      };
    } catch {
      return null;
    }
  });
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      const keys = Object.keys(localStorage);
      return keys.some((key) => key.includes('auth-token'));
    },
    { timeout }
  );
}

/**
 * Clean up test users (optional - for teardown)
 */
export async function cleanupTestUsers() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - skipping test user cleanup');
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const userData of Object.values(TEST_USERS)) {
    try {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users.find((u) => u.email === userData.email);

      if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`🗑️  Deleted test user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup user ${userData.email}:`, error);
    }
  }
}
