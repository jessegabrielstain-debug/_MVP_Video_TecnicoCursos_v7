export const dashboardStatsFixture = {
  totalProjects: 12,
  activeRenders: 3,
  completedToday: 5,
  totalViews: 1240,
  avgRenderTime: 4,
  systemHealth: 'healthy' as const
};

export const authSuccessResponse = {
  access_token: 'test-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'test-refresh-token',
  user: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'pro@example.com'
  }
};

export const sessionSuccessResponse = {
  user: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'pro@example.com'
  },
  session: {
    access_token: 'test-access-token',
    token_type: 'bearer'
  }
};

export const authErrorResponse = {
  error: 'invalid_grant',
  error_description: 'Invalid login credentials'
};
