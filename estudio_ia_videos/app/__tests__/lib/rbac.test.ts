import { getPermissions, can, assignRole } from '../../lib/rbac';

describe('RBAC core', () => {
  const admin = { id: 'u1', roles: ['admin'] } as const;
  const editor = { id: 'u2', roles: ['editor'] } as const;
  test('admin has admin.dashboard', () => {
    expect(can(admin, 'admin.dashboard')).toBe(true);
  });
  test('editor lacks roles.write', () => {
    expect(can(editor, 'roles.write')).toBe(false);
  });
  test('assignRole adds new role', () => {
    const updated = assignRole({ id: 'x', roles: ['viewer'] }, 'editor');
    expect(updated.roles).toContain('editor');
  });
  test('permissions aggregation', () => {
    const perms = getPermissions(admin);
    expect(perms.has('users.write')).toBe(true);
  });
});