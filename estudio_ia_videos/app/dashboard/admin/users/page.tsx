import React from 'react';
import { can, UserContext } from '../../../../lib/rbac';

function getCurrentUser(): UserContext { return { id: 'u1', roles: ['admin'] }; }

async function fetchUsers() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) return [];
  const data = await res.json();
  return data.users as UserContext[];
}

export default async function AdminUsersPage() {
  const current = getCurrentUser();
  if (!can(current, 'users.read')) {
    return <div className="p-6 text-sm">Acesso negado.</div>;
  }
  const users = await fetchUsers();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Administração de Usuários</h1>
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr className="border-b"><th className="text-left py-2">ID</th><th className="text-left py-2">Papéis</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b"><td className="py-1">{u.id}</td><td className="py-1">{u.roles.join(', ')}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
