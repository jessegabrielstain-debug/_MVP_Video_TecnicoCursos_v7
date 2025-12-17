import { test, expect, Page } from '@playwright/test';

/**
 * API Contract Tests - Validates API response structures
 * 
 * These tests ensure that our API endpoints return data in the expected format,
 * which is crucial for frontend-backend contract stability.
 */

test.describe('API Contract Validation', () => {
  
  test.describe('/api/render endpoints', () => {
    test('POST /api/render/start returns valid job structure', async ({ request }) => {
      const response = await request.post('/api/render/start', {
        data: {
          projectId: 'test-project-123',
          slides: [
            { id: '1', content: 'Test slide 1' },
            { id: '2', content: 'Test slide 2' }
          ]
        }
      });

      expect(response.status()).toBe(201);
      
      const data = await response.json();
      
      // Validate response structure
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('jobId');
      expect(data.data).toHaveProperty('status', 'pending');
      expect(data.data).toHaveProperty('createdAt');
      
      // Validate types
      expect(typeof data.data.jobId).toBe('string');
      expect(data.data.jobId).toMatch(/^[a-fA-F0-9-]+$/);
      expect(new Date(data.data.createdAt)).toBeInstanceOf(Date);
    });

    test('GET /api/render/jobs returns valid job list', async ({ request }) => {
      const response = await request.get('/api/render/jobs');
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      
      // If jobs exist, validate structure
      if (data.data.length > 0) {
        const job = data.data[0];
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('status');
        expect(job).toHaveProperty('projectId');
        expect(job).toHaveProperty('createdAt');
        expect(job).toHaveProperty('updatedAt');
        
        // Validate status enum
        expect(['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'])
          .toContain(job.status);
      }
    });

    test('GET /api/render/progress/[jobId] returns valid progress structure', async ({ request }) => {
      // First create a job
      const createResponse = await request.post('/api/render/start', {
        data: { projectId: 'test-progress', slides: [{ id: '1', content: 'Test' }] }
      });
      const { jobId } = (await createResponse.json()).data;

      const response = await request.get(`/api/render/progress/${jobId}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('jobId', jobId);
      expect(data.data).toHaveProperty('progress');
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('phase');
      
      // Validate progress is a number between 0-100
      expect(typeof data.data.progress).toBe('number');
      expect(data.data.progress).toBeGreaterThanOrEqual(0);
      expect(data.data.progress).toBeLessThanOrEqual(100);
    });
  });

  test.describe('/api/analytics endpoints', () => {
    test('GET /api/analytics/render-stats returns valid metrics', async ({ request }) => {
      const response = await request.get('/api/analytics/render-stats');
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      
      const analytics = data.data;
      
      // Basic stats
      expect(analytics).toHaveProperty('basicStats');
      expect(analytics.basicStats).toHaveProperty('totalJobs');
      expect(analytics.basicStats).toHaveProperty('completedJobs');
      expect(analytics.basicStats).toHaveProperty('failedJobs');
      expect(analytics.basicStats).toHaveProperty('averageRenderTime');
      
      // Performance metrics
      expect(analytics).toHaveProperty('performanceMetrics');
      expect(analytics.performanceMetrics).toHaveProperty('p50');
      expect(analytics.performanceMetrics).toHaveProperty('p90');
      expect(analytics.performanceMetrics).toHaveProperty('p95');
      
      // Queue stats
      expect(analytics).toHaveProperty('queueStats');
      expect(analytics.queueStats).toHaveProperty('waiting');
      expect(analytics.queueStats).toHaveProperty('active');
      expect(analytics.queueStats).toHaveProperty('completed');
      expect(analytics.queueStats).toHaveProperty('failed');
    });
  });

  test.describe('/api/projects endpoints', () => {
    test('POST /api/projects creates project with valid structure', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          title: 'Test Project Contract',
          description: 'Testing API contract validation'
        }
      });

      expect(response.status()).toBe(201);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      
      const project = data.data;
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('title', 'Test Project Contract');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('userId');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
      
      // Validate UUID format
      expect(project.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('GET /api/projects returns paginated project list', async ({ request }) => {
      const response = await request.get('/api/projects?page=1&limit=10');
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      
      const pagination = data.pagination;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test.describe('Error Response Contracts', () => {
    test('Invalid endpoints return standardized error structure', async ({ request }) => {
      const response = await request.get('/api/nonexistent-endpoint');
      
      expect(response.status()).toBe(404);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('code');
    });

    test('Validation errors return detailed error structure', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          // Missing required fields
          title: ''
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(data.error).toHaveProperty('details');
    });

    test('Authentication errors return auth error structure', async ({ request }) => {
      const response = await request.post('/api/projects', {
        headers: {
          // Invalid/missing auth
          'Authorization': 'Bearer invalid-token'
        },
        data: {
          title: 'Test Project'
        }
      });

      // Should be 401 Unauthorized
      expect([401, 403]).toContain(response.status());
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(['AUTHENTICATION_ERROR', 'AUTHORIZATION_ERROR']).toContain(data.error.code);
    });
  });
});

/**
 * Response Time Contract Tests
 * Ensures APIs meet performance SLA contracts
 */
test.describe('Performance Contract Validation', () => {
  test('Critical endpoints respond within SLA times', async ({ request }) => {
    const endpoints = [
      { path: '/api/render/jobs', method: 'GET', maxMs: 1000 },
      { path: '/api/projects', method: 'GET', maxMs: 800 },
      { path: '/api/analytics/render-stats', method: 'GET', maxMs: 2000 }
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      
      let response;
      if (endpoint.method === 'GET') {
        response = await request.get(endpoint.path);
      } else {
        response = await request.post(endpoint.path, { data: {} });
      }
      
      const duration = Date.now() - start;
      
      expect(response.status()).toBeLessThan(500); // No server errors
      expect(duration).toBeLessThan(endpoint.maxMs);
      
      console.log(`✅ ${endpoint.method} ${endpoint.path}: ${duration}ms (max: ${endpoint.maxMs}ms)`);
    }
  });
});

/**
 * Data Consistency Contract Tests
 * Validates data relationships and constraints
 */
test.describe('Data Consistency Contracts', () => {
  test('Project-slide relationship integrity', async ({ request }) => {
    // Create project
    const projectResponse = await request.post('/api/projects', {
      data: { title: 'Relationship Test', description: 'Testing data relationships' }
    });
    const { id: projectId } = (await projectResponse.json()).data;

    // Add slides to project  
    const slideResponse = await request.post('/api/slides', {
      data: { 
        projectId, 
        content: 'Test slide content',
        orderIndex: 0
      }
    });
    
    expect(slideResponse.status()).toBe(201);
    const slide = (await slideResponse.json()).data;
    
    // Verify slide belongs to project
    expect(slide.projectId).toBe(projectId);
    
    // Get project with slides
    const projectWithSlidesResponse = await request.get(`/api/projects/${projectId}?include=slides`);
    const projectData = (await projectWithSlidesResponse.json()).data;
    
    expect(Array.isArray(projectData.slides)).toBe(true);
    expect(projectData.slides).toHaveLength(1);
    expect(projectData.slides[0].id).toBe(slide.id);
  });

  test('Render job status transitions are valid', async ({ request }) => {
    // Create render job
    const jobResponse = await request.post('/api/render/start', {
      data: { projectId: 'test-status', slides: [{ id: '1', content: 'Test' }] }
    });
    const { jobId } = (await jobResponse.json()).data;

    // Job should start as pending
    let statusResponse = await request.get(`/api/render/jobs/${jobId}`);
    let job = (await statusResponse.json()).data;
    expect(job.status).toBe('pending');

    // Allow some time for status transitions
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check that status transitions are valid
    statusResponse = await request.get(`/api/render/jobs/${jobId}`);
    job = (await statusResponse.json()).data;
    
    const validTransitions = ['pending', 'queued', 'processing', 'completed', 'failed'];
    expect(validTransitions).toContain(job.status);
    
    // If processing, should have progress
    if (job.status === 'processing') {
      expect(job).toHaveProperty('progress');
      expect(typeof job.progress).toBe('number');
    }
  });
});