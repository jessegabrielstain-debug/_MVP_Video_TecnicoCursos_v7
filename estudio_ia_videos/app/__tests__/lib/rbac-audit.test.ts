import { assignRoleWithAudit, UserContext } from '../../lib/rbac';

jest.mock('../../lib/supabase/server', () => ({
  supabaseAdmin: {
    from() {
      return { upsert: jest.fn().mockResolvedValue({}), insert: jest.fn().mockResolvedValue({}) } as any;
    }
  }
}));

describe('RBAC assignRoleWithAudit', () => {
  it('adiciona role e não lança erro em falha supabase', async () => {
    const user: UserContext = { id: 'uX', roles: ['viewer'] };
    const updated = await assignRoleWithAudit(user, 'editor', 'actor1');
    expect(updated.roles.includes('editor')).toBe(true);
  });
});
