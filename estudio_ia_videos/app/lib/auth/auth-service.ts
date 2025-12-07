/**
 * Auth Service
 * Serviço de autenticação e autorização
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  currentOrgId?: string;
  isAdmin?: boolean;
  role?: string;
  avatar?: string;
  permissions?: string[];
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: Date | string;
  lastLoginAt?: Date | string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser & { avatar?: string; permissions?: string[]; preferences?: Record<string, unknown> };
}

export class AuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    
    // Enrich session user with DB data if needed
    // For now, assume session has what we need or fetch from DB
    return session.user as AuthUser;
  }
  
  async getUserFromToken(token: string): Promise<AuthUser | null> {
    // Mock implementation - in production, verify JWT and extract user
    try {
      const session = await getServerSession(authOptions);
      return session?.user as AuthUser || null;
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  }
  
  async login(email: string, password: string, request: Request): Promise<AuthTokens> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'Login failed');
    }

    // Basic user mapping from Supabase auth data
    const user: AuthUser & { avatar?: string; permissions?: string[]; preferences?: Record<string, unknown> } = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      role: data.user.user_metadata?.role || 'user',
      avatar: data.user.user_metadata?.avatar_url,
      permissions: [],
      preferences: {}
    };

    // Enrich with DB data
    try {
       const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
       if (dbUser) {
           user.role = dbUser.role || user.role;
           // user.permissions = ... // Fetch permissions if needed
       } else {
           // Create user in DB if not exists (sync)
           // This is optional but good for consistency
       }
    } catch (e) {
        console.warn("Could not fetch user details from DB during login", e);
    }
    
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: (data.session.expires_at || (Date.now() / 1000) + 3600) * 1000,
      user
    };
  }
  
  async logout(userId: string): Promise<void> {
    // Mock implementation - in production, invalidate tokens
    console.log('Logout user:', userId);
  }
  
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Mock implementation - in production, verify refresh token and issue new tokens
    const user: AuthUser & { avatar?: string; permissions?: string[]; preferences?: Record<string, unknown> } = {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
      role: 'user',
      permissions: ['project:read', 'project:create'],
      preferences: {}
    };
    
    return {
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresAt: Date.now() + 3600000,
      user
    };
  }
  
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    // Mock implementation - in production, verify old password and update
    try {
      // Validate password strength
      if (newPassword.length < 8) return false;
      
      // In production: verify oldPassword, hash newPassword, update DB
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }
  
  async verifyPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // Real implementation: Check RBAC in database
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) return false;

      // Admin has all permissions
      if (user.role === 'admin') return true;

      // Basic role mapping (can be expanded to a real permission table)
      if (resource === 'project' && action === 'create') return true; // All users can create projects
      if (resource === 'project' && action === 'delete') return false; // Only admins delete (example)
      
      return false;
    } catch (error) {
      console.error('Error verifying permission:', error);
      return false;
    }
  }
  
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      return user?.role === 'admin';
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
