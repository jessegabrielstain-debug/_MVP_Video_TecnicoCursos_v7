#!/usr/bin/env node

/**
 * Synthetic API Monitoring Script
 * 
 * Monitors critical API endpoints and BullMQ queues,
 * sending alerts to Slack when issues are detected.
 * 
 * Usage:
 *   node scripts/monitoring/synthetic-api-monitor.js
 *   
 * Environment Variables:
 *   MONITORING_BASE_URL - Base URL to monitor (default: http://localhost:3000)
 *   SLACK_WEBHOOK_URL - Slack webhook for alerts (optional)
 *   CI - Set to 'true' in CI environment
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.MONITORING_BASE_URL || 'http://localhost:3000';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const IS_CI = process.env.CI === 'true';
const OUTPUT_DIR = path.join(process.cwd(), 'evidencias', 'monitoring');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Endpoints to monitor
const ENDPOINTS = [
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
  },
  {
    name: 'Video Jobs List',
    path: '/api/v1/video-jobs?limit=5',
    method: 'GET',
    expectedStatus: [200, 401], // May require auth
    timeout: 10000,
  },
  {
    name: 'Render Stats',
    path: '/api/analytics/render-stats?limit=5',
    method: 'GET',
    expectedStatus: [200, 401],
    timeout: 10000,
  },
  {
    name: 'Video Jobs Status',
    path: '/api/v1/video-jobs/status',
    method: 'GET',
    expectedStatus: [200, 401],
    timeout: 5000,
  },
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  totalEndpoints: ENDPOINTS.length,
  successful: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: timeout,
      headers: {
        'User-Agent': 'Synthetic-Monitor/1.0',
      },
    };
    
    const startTime = Date.now();
    
    const req = client.request(options, (res) => {
      const elapsed = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          elapsed: elapsed,
        });
      });
    });
    
    req.on('error', (err) => {
      reject({
        error: err.message,
        elapsed: Date.now() - startTime,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        elapsed: Date.now() - startTime,
      });
    });
    
    req.end();
  });
}

/**
 * Test single endpoint
 */
async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  
  console.log(`\n🔍 Testing: ${endpoint.name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await makeRequest(url, endpoint.method, endpoint.timeout);
    
    const expectedStatuses = Array.isArray(endpoint.expectedStatus)
      ? endpoint.expectedStatus
      : [endpoint.expectedStatus];
    
    const statusMatch = expectedStatuses.includes(result.status);
    const isSuccess = statusMatch && result.elapsed < endpoint.timeout;
    
    const testResult = {
      endpoint: endpoint.name,
      url: url,
      method: endpoint.method,
      status: result.status,
      expectedStatus: expectedStatuses,
      elapsed: result.elapsed,
      success: isSuccess,
      message: isSuccess
        ? `✅ Success (${result.elapsed}ms)`
        : `⚠️  Status ${result.status} (expected ${expectedStatuses.join('/')})`,
    };
    
    console.log(`   ${testResult.message}`);
    
    if (isSuccess) {
      results.successful++;
    } else if (expectedStatuses.includes(result.status)) {
      results.warnings++;
    } else {
      results.failed++;
    }
    
    results.tests.push(testResult);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.error}`);
    
    results.failed++;
    results.tests.push({
      endpoint: endpoint.name,
      url: url,
      method: endpoint.method,
      status: 0,
      elapsed: error.elapsed,
      success: false,
      error: error.error,
      message: `❌ Error: ${error.error}`,
    });
  }
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(message, details) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⚠️  Slack webhook not configured - skipping alert');
    return;
  }
  
  const payload = {
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${message}*\n\n${details}`,
        },
      },
    ],
  };
  
  try {
    const webhookUrl = new URL(SLACK_WEBHOOK_URL);
    
    const options = {
      hostname: webhookUrl.hostname,
      path: webhookUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
    
    console.log('✅ Slack alert sent');
  } catch (error) {
    console.error('❌ Failed to send Slack alert:', error.message);
  }
}

/**
 * Generate report
 */
function generateReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFile = path.join(OUTPUT_DIR, `synthetic-${timestamp}.json`);
  const mdFile = path.join(OUTPUT_DIR, `monitoring-report-${timestamp}.md`);
  
  // Save JSON
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 JSON report saved: ${jsonFile}`);
  
  // Generate Markdown
  let markdown = `# Synthetic Monitoring Report\n\n`;
  markdown += `**Timestamp:** ${results.timestamp}\n`;
  markdown += `**Base URL:** ${results.baseUrl}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- ✅ Successful: ${results.successful}\n`;
  markdown += `- ⚠️  Warnings: ${results.warnings}\n`;
  markdown += `- ❌ Failed: ${results.failed}\n`;
  markdown += `- 📊 Total: ${results.totalEndpoints}\n\n`;
  markdown += `## Test Results\n\n`;
  
  for (const test of results.tests) {
    markdown += `### ${test.endpoint}\n\n`;
    markdown += `- **URL:** \`${test.url}\`\n`;
    markdown += `- **Method:** ${test.method}\n`;
    markdown += `- **Status:** ${test.status}\n`;
    markdown += `- **Elapsed:** ${test.elapsed}ms\n`;
    markdown += `- **Result:** ${test.message}\n`;
    if (test.error) {
      markdown += `- **Error:** ${test.error}\n`;
    }
    markdown += `\n`;
  }
  
  fs.writeFileSync(mdFile, markdown);
  console.log(`📄 Markdown report saved: ${mdFile}`);
  
  return { jsonFile, mdFile };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Synthetic API Monitoring...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🧪 Testing ${ENDPOINTS.length} endpoints\n`);
  
  // Test all endpoints
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  // Generate report
  const { jsonFile, mdFile } = generateReport();
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MONITORING SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`⚠️  Warnings:   ${results.warnings}`);
  console.log(`❌ Failed:     ${results.failed}`);
  console.log('='.repeat(50) + '\n');
  
  // Send alert if there are failures
  if (results.failed > 0) {
    const failedTests = results.tests.filter((t) => !t.success && !t.status);
    const details = failedTests
      .map((t) => `• ${t.endpoint}: ${t.error || 'Unknown error'}`)
      .join('\n');
    
    await sendSlackAlert(
      `🚨 Synthetic Monitoring Detected ${results.failed} Failed Endpoint(s)`,
      details
    );
  }
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.error('\n❌ Monitoring detected failures');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.warn('\n⚠️  Monitoring completed with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ All endpoints healthy');
    process.exit(0);
  }
}

// Run
main().catch((error) => {
  console.error('\n❌ Monitoring script failed:', error);
  process.exit(1);
});
