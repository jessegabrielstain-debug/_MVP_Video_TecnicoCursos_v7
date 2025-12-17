import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { assertCan, UserContext } from '../../../lib/rbac';
import { supabaseAdmin, fromUntypedTable } from '../../../lib/supabase/server';

interface RoleRow { role: string; description?: string }

async function buildUserContext(userId: string): Promise<UserContext> {
  const admin = supabaseAdmin;
  const { data: rolesData } = await admin.from('user_roles').select('role').eq('user_id', userId);
  const roles = ((rolesData || []) as unknown as RoleRow[]).map((r) => r.role) as UserContext['roles'];
  return { id: userId, roles: roles.length ? roles : ['viewer'] };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ctx = await buildUserContext(session.user.id);
  assertCan(ctx, 'roles.read');
  const { data, error } = await fromUntypedTable<RoleRow>(supabaseAdmin, 'roles').select('role, description');
  if (error) return NextResponse.json({ error: 'Falha ao listar roles' }, { status: 500 });
  return NextResponse.json({ roles: data });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ctx = await buildUserContext(session.user.id);
  assertCan(ctx, 'roles.write');
  const body = await req.json().catch(() => ({}));
  const { role, description } = body || {};
  if (!role) return NextResponse.json({ error: 'role obrigatório' }, { status: 400 });
  const rolesTable = fromUntypedTable<RoleRow>(supabaseAdmin, 'roles');
  const { error: insErr } = await (rolesTable as unknown as { upsert: (data: RoleRow) => Promise<{ error: Error | null }> }).upsert({ role, description: description || '' });
  if (insErr) return NextResponse.json({ error: 'Falha ao criar/atualizar role' }, { status: 500 });
  return NextResponse.json({ created: role });
}

