import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { assertCan, UserContext, assignRoleWithAudit } from '../../../lib/rbac';
import { supabaseAdmin } from '../../../lib/supabase/server';

async function buildUserContext(userId: string): Promise<UserContext> {
  const admin = supabaseAdmin;
  const { data: rolesData } = await admin.from('user_roles').select('role').eq('user_id', userId);
  const roles = ((rolesData as any[]) || []).map((r: any) => r.role) as unknown as UserContext['roles'];
  return { id: userId, roles: roles.length ? roles : ['viewer'] };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const currentCtx = await buildUserContext(session.user.id);
  assertCan(currentCtx, 'users.read');
  const admin = supabaseAdmin;
  const { data: usersData, error } = await admin.from('users').select('id');
  if (error) return NextResponse.json({ error: 'Falha ao buscar usuários' }, { status: 500 });
  // Carregar roles para cada usuário
  const rolesResp = await admin.from('user_roles').select('user_id, role');
  const rolesMap = new Map<string, string[]>();
  ((rolesResp.data as any[]) || []).forEach((r: any) => {
    const arr = rolesMap.get(r.user_id) || [];
    arr.push(r.role as string);
    rolesMap.set(r.user_id, arr);
  });
  const users = (usersData || []).map((u: { id: string }) => ({ id: u.id, roles: rolesMap.get(u.id) || ['viewer'] }));
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const currentCtx = await buildUserContext(session.user.id);
  assertCan(currentCtx, 'users.write');
  const body = await req.json().catch(() => ({}));
  const { userId, role } = body || {};
  if (!userId || !role) return NextResponse.json({ error: 'userId e role obrigatórios' }, { status: 400 });
  const targetCtx = await buildUserContext(userId);
  const updated = await assignRoleWithAudit(targetCtx, role, currentCtx.id);
  return NextResponse.json({ updated });
}

