#!/usr/bin/env node

/**
 * Automated Test Suite for Navy Display System v2.0
 * Tests API endpoints, data validation, system functionality, and new features
 * Last updated: 20/06/2025
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test result tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Utility functions
 */
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? 'green' : 'red';
  log(`${symbol} ${testName}${details ? ' - ' + details : ''}`, color);
  
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function makeRequest(method, endpoint, data = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url);
    const responseData = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text();
    
    return {
      status: response.status,
      data: responseData,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: error.message,
      ok: false,
      error: true
    };
  }
}

/**
 * Test suites
 */
async function testHealthCheck() {
  log('\n🔍 Testing Health Check...', 'cyan');
  
  const response = await makeRequest('GET', '/health');
  
  if (response.ok && response.data && typeof response.data === 'object') {
    logTest('Health check endpoint', 'PASS');
  } else {
    logTest('Health check endpoint', 'FAIL', `Status: ${response.status}`);
  }
}

async function testNoticesCRUD() {
  log('\n📋 Testing Notices CRUD Operations...', 'cyan');
  
  // Test GET empty notices
  let response = await makeRequest('GET', '/notices');
  if (response.ok && Array.isArray(response.data)) {
    logTest('GET notices (empty)', 'PASS');
  } else {
    logTest('GET notices (empty)', 'FAIL', `Status: ${response.status}`);
  }

  // Test POST notice
  const newNotice = {
    title: 'Test Notice - Sistema v2.0',
    content: 'Teste automatizado do sistema atualizado com pôr do sol e layout responsivo',
    priority: 'high',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
    active: true
  };

  response = await makeRequest('POST', '/notices', newNotice);
  if (response.ok && response.data.id) {
    logTest('POST notice', 'PASS');
    
    const noticeId = response.data.id;
    
    // Test GET specific notice
    response = await makeRequest('GET', `/notices`);
    if (response.ok && response.data.length > 0) {
      logTest('GET notices (with data)', 'PASS');
    } else {
      logTest('GET notices (with data)', 'FAIL');
    }

    // Test PUT notice
    const updatedNotice = { ...response.data[0], title: 'Updated Test Notice' };
    response = await makeRequest('PUT', `/notices/${noticeId}`, updatedNotice);
    if (response.ok && response.data.title === 'Updated Test Notice') {
      logTest('PUT notice', 'PASS');
    } else {
      logTest('PUT notice', 'FAIL');
    }

    // Test DELETE notice
    response = await makeRequest('DELETE', `/notices/${noticeId}`);
    if (response.ok && response.data.success) {
      logTest('DELETE notice', 'PASS');
    } else {
      logTest('DELETE notice', 'FAIL');
    }
  } else {
    logTest('POST notice', 'FAIL', `Status: ${response.status}`);
  }
}

async function testDocumentsCRUD() {
  log('\n📄 Testing Documents CRUD Operations...', 'cyan');
  
  // Test GET empty documents
  let response = await makeRequest('GET', '/documents');
  if (response.ok && Array.isArray(response.data)) {
    logTest('GET documents (empty)', 'PASS');
  } else {
    logTest('GET documents (empty)', 'FAIL', `Status: ${response.status}`);
  }

  // Test POST document
  const newDocument = {
    title: 'Test Document',
    url: '/test/document.pdf',
    type: 'plasa',
    category: 'oficial',
    active: true
  };

  response = await makeRequest('POST', '/documents', newDocument);
  if (response.ok && response.data.id) {
    logTest('POST document', 'PASS');
    
    const documentId = response.data.id;
    
    // Test GET specific document
    response = await makeRequest('GET', `/documents`);
    if (response.ok && response.data.length > 0) {
      logTest('GET documents (with data)', 'PASS');
    } else {
      logTest('GET documents (with data)', 'FAIL');
    }

    // Test PUT document
    const updatedDocument = { ...response.data[0], title: 'Updated Test Document' };
    response = await makeRequest('PUT', `/documents/${documentId}`, updatedDocument);
    if (response.ok && response.data.title === 'Updated Test Document') {
      logTest('PUT document', 'PASS');
    } else {
      logTest('PUT document', 'FAIL');
    }

    // Test DELETE document
    response = await makeRequest('DELETE', `/documents/${documentId}`);
    if (response.ok && response.data.success) {
      logTest('DELETE document', 'PASS');
    } else {
      logTest('DELETE document', 'FAIL');
    }
  } else {
    logTest('POST document', 'FAIL', `Status: ${response.status}`);
  }
}

async function testDataValidation() {
  log('\n✅ Testing Data Validation...', 'cyan');
  
  // Test invalid notice data
  const invalidNotice = {
    title: '', // Empty title
    content: 'Test content',
    priority: 'invalid_priority', // Invalid priority
    startDate: 'invalid_date', // Invalid date
    endDate: new Date().toISOString(),
    active: true
  };

  let response = await makeRequest('POST', '/notices', invalidNotice);
  if (!response.ok && response.status === 400) {
    logTest('Notice validation (invalid data)', 'PASS');
  } else {
    logTest('Notice validation (invalid data)', 'FAIL', 'Should reject invalid data');
  }

  // Test invalid document data
  const invalidDocument = {
    title: 'Test',
    url: '/test.pdf',
    type: 'invalid_type', // Invalid type
    active: true
  };

  response = await makeRequest('POST', '/documents', invalidDocument);
  if (!response.ok && response.status === 400) {
    logTest('Document validation (invalid data)', 'PASS');
  } else {
    logTest('Document validation (invalid data)', 'FAIL', 'Should reject invalid data');
  }
}

async function testFrontendAccessibility() {
  log('\n🌐 Testing Frontend Accessibility...', 'cyan');
  
  // Test main page
  let response = await makeRequest('GET', BASE_URL);
  if (response.ok) {
    logTest('Main page loads', 'PASS');
  } else {
    logTest('Main page loads', 'FAIL', `Status: ${response.status}`);
  }

  // Test admin page
  response = await makeRequest('GET', `${BASE_URL}/admin`);
  if (response.ok) {
    logTest('Admin page loads', 'PASS');
  } else {
    logTest('Admin page loads', 'FAIL', `Status: ${response.status}`);
  }
}

async function testErrorHandling() {
  log('\n🚨 Testing Error Handling...', 'cyan');
  
  // Test 404 for non-existent notice
  let response = await makeRequest('GET', '/notices/99999');
  if (response.status === 404) {
    logTest('404 handling (notice)', 'PASS');
  } else {
    logTest('404 handling (notice)', 'FAIL', `Expected 404, got ${response.status}`);
  }

  // Test 404 for non-existent document
  response = await makeRequest('GET', '/documents/99999');
  if (response.status === 404) {
    logTest('404 handling (document)', 'PASS');
  } else {
    logTest('404 handling (document)', 'FAIL', `Expected 404, got ${response.status}`);
  }

  // Test invalid endpoint
  response = await makeRequest('GET', '/invalid-endpoint');
  if (response.status === 404) {
    logTest('404 handling (invalid endpoint)', 'PASS');
  } else {
    logTest('404 handling (invalid endpoint)', 'FAIL', `Expected 404, got ${response.status}`);
  }
}

async function waitForServer() {
  log('⏳ Waiting for server to start...', 'yellow');
  
  for (let i = 0; i < 30; i++) {
    try {
      const response = await makeRequest('GET', '/health');
      if (response.ok) {
        log('✅ Server is ready!', 'green');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await setTimeout(1000);
  }
  
  log('❌ Server failed to start within 30 seconds', 'red');
  return false;
}

async function runAllTests() {
  log('🧪 Navy Display System - Automated Test Suite', 'magenta');
  log('================================================', 'magenta');
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  // Run all test suites
  await testHealthCheck();
  await testNoticesCRUD();
  await testDocumentsCRUD();
  await testDataValidation();
  await testFrontendAccessibility();
  await testErrorHandling();

  // Display results
  log('\n📊 Test Results Summary', 'magenta');
  log('======================', 'magenta');
  log(`Total Tests: ${testResults.total}`, 'white');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
    testResults.failed === 0 ? 'green' : 'yellow');

  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! System is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check the issues above.', 'red');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((error) => {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { runAllTests, testResults };