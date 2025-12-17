/**
 * 📊 K6 Load Testing Configuration
 * Performance testing for MVP Video TécnicoCursos
 * FASE 8.6 - Load Testing
 * 
 * Run with: k6 run scripts/load-test.js
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const renderLatency = new Trend('render_api_latency');

// Test configuration
export const options = {
  // Load stages
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 25 },   // Ramp up to 25 users
    { duration: '2m', target: 25 },    // Stay at 25 users (peak)
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // Thresholds (SLAs)
  thresholds: {
    // General HTTP
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% errors
    
    // Custom
    errors: ['rate<0.05'],                           // Less than 5% errors
    api_latency: ['p(95)<300'],                      // API calls under 300ms
    render_api_latency: ['p(95)<2000'],              // Render APIs under 2s
  },

  // Summary output
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Common headers
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  return headers;
}

// ============================================
// Test Scenarios
// ============================================

export default function() {
  group('Health & Status', function() {
    testHealthEndpoint();
  });

  group('Public APIs', function() {
    testPublicEndpoints();
  });

  // Only run authenticated tests if token is provided
  if (AUTH_TOKEN) {
    group('Authenticated APIs', function() {
      testAuthenticatedEndpoints();
    });

    group('Render Pipeline', function() {
      testRenderEndpoints();
    });
  }

  // Think time between iterations
  sleep(1);
}

// ============================================
// Health Check Tests
// ============================================

function testHealthEndpoint() {
  const response = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health' },
  });

  const success = check(response, {
    'health status is 200': (r) => r.status === 200,
    'health response has status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });

  errorRate.add(!success);
  apiLatency.add(response.timings.duration);
}

// ============================================
// Public Endpoint Tests
// ============================================

function testPublicEndpoints() {
  // Test NR Courses listing (public)
  const coursesResponse = http.get(`${BASE_URL}/api/nr-courses`, {
    headers: getHeaders(),
    tags: { name: 'nr-courses' },
  });

  check(coursesResponse, {
    'courses returns 200 or 401': (r) => [200, 401].includes(r.status),
    'courses response time < 500ms': (r) => r.timings.duration < 500,
  });

  apiLatency.add(coursesResponse.timings.duration);

  // Test templates (if public)
  const templatesResponse = http.get(`${BASE_URL}/api/templates`, {
    headers: getHeaders(),
    tags: { name: 'templates' },
  });

  check(templatesResponse, {
    'templates returns valid status': (r) => [200, 401, 404].includes(r.status),
    'templates response time < 500ms': (r) => r.timings.duration < 500,
  });

  apiLatency.add(templatesResponse.timings.duration);
}

// ============================================
// Authenticated Endpoint Tests
// ============================================

function testAuthenticatedEndpoints() {
  // Test projects listing
  const projectsResponse = http.get(`${BASE_URL}/api/projects`, {
    headers: getHeaders(),
    tags: { name: 'projects' },
  });

  const projectsSuccess = check(projectsResponse, {
    'projects returns 200': (r) => r.status === 200,
    'projects is array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
    'projects response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!projectsSuccess);
  apiLatency.add(projectsResponse.timings.duration);

  // Test user profile
  const profileResponse = http.get(`${BASE_URL}/api/user/profile`, {
    headers: getHeaders(),
    tags: { name: 'profile' },
  });

  check(profileResponse, {
    'profile returns valid status': (r) => [200, 404].includes(r.status),
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });

  apiLatency.add(profileResponse.timings.duration);

  // Test notifications
  const notificationsResponse = http.get(`${BASE_URL}/api/notifications`, {
    headers: getHeaders(),
    tags: { name: 'notifications' },
  });

  check(notificationsResponse, {
    'notifications returns valid status': (r) => [200, 404].includes(r.status),
    'notifications response time < 500ms': (r) => r.timings.duration < 500,
  });

  apiLatency.add(notificationsResponse.timings.duration);
}

// ============================================
// Render Pipeline Tests
// ============================================

function testRenderEndpoints() {
  // Test render jobs listing
  const jobsResponse = http.get(`${BASE_URL}/api/render/jobs`, {
    headers: getHeaders(),
    tags: { name: 'render-jobs' },
  });

  const jobsSuccess = check(jobsResponse, {
    'render jobs returns 200': (r) => r.status === 200,
    'render jobs response time < 1s': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!jobsSuccess);
  renderLatency.add(jobsResponse.timings.duration);

  // Test render stats
  const statsResponse = http.get(`${BASE_URL}/api/analytics/render-stats`, {
    headers: getHeaders(),
    tags: { name: 'render-stats' },
  });

  check(statsResponse, {
    'render stats returns valid status': (r) => [200, 404].includes(r.status),
    'render stats response time < 2s': (r) => r.timings.duration < 2000,
  });

  renderLatency.add(statsResponse.timings.duration);

  // Test queue status
  const queueResponse = http.get(`${BASE_URL}/api/render/queue/stats`, {
    headers: getHeaders(),
    tags: { name: 'queue-stats' },
  });

  check(queueResponse, {
    'queue stats returns valid status': (r) => [200, 404].includes(r.status),
    'queue stats response time < 1s': (r) => r.timings.duration < 1000,
  });

  renderLatency.add(queueResponse.timings.duration);
}

// ============================================
// Lifecycle Hooks
// ============================================

export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Auth token: ${AUTH_TOKEN ? 'Provided' : 'Not provided (public endpoints only)'}`);
  
  // Verify service is up
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Service not healthy: ${healthCheck.status}`);
  }
  
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
}

// ============================================
// Summary Handler
// ============================================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    duration: data.state.testRunDurationMs,
    metrics: {
      requests: data.metrics.http_reqs?.values?.count || 0,
      failedRequests: data.metrics.http_req_failed?.values?.rate || 0,
      avgDuration: data.metrics.http_req_duration?.values?.avg || 0,
      p95Duration: data.metrics.http_req_duration?.values['p(95)'] || 0,
      p99Duration: data.metrics.http_req_duration?.values['p(99)'] || 0,
    },
    thresholds: {
      passed: Object.values(data.thresholds || {}).filter(t => t.ok).length,
      failed: Object.values(data.thresholds || {}).filter(t => !t.ok).length,
    },
  };

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'logs/load-test-results.json': JSON.stringify(summary, null, 2),
  };
}

// Text summary helper
function textSummary(data, options) {
  const metrics = data.metrics;
  const lines = [
    '',
    '═══════════════════════════════════════════════════════════',
    '  📊 LOAD TEST RESULTS - MVP Video TécnicoCursos',
    '═══════════════════════════════════════════════════════════',
    '',
    `  Total Requests: ${metrics.http_reqs?.values?.count || 0}`,
    `  Failed Requests: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`,
    '',
    '  Response Times:',
    `    Average: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms`,
    `    P90: ${(metrics.http_req_duration?.values['p(90)'] || 0).toFixed(2)}ms`,
    `    P95: ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`,
    `    P99: ${(metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms`,
    '',
    '  Thresholds:',
  ];

  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✅' : '❌';
    lines.push(`    ${status} ${name}`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}
