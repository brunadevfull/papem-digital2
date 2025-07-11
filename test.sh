#!/bin/bash

# Navy Display System - Automated Test Script
# Comprehensive testing suite for Oracle Linux and other environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_status=${3:-0}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing ${test_name}... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ $? -eq $expected_status ]; then
            log $GREEN "PASS"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            log $RED "FAIL (unexpected exit code)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        log $RED "FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test API endpoint
test_api() {
    local endpoint=$1
    local method=${2:-GET}
    local expected_status=${3:-200}
    local data=${4:-""}
    
    local curl_cmd="curl -s -w '%{http_code}' -o /dev/null"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json' -d '$data'"
    elif [ "$method" = "PUT" ] && [ -n "$data" ]; then
        curl_cmd="$curl_cmd -X PUT -H 'Content-Type: application/json' -d '$data'"
    elif [ "$method" = "DELETE" ]; then
        curl_cmd="$curl_cmd -X DELETE"
    fi
    
    local response_code=$(eval "$curl_cmd http://localhost:5000/api$endpoint")
    
    if [ "$response_code" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Function to wait for server
wait_for_server() {
    log $YELLOW "Waiting for server to start..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
            log $GREEN "Server is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log $RED "Server failed to start within 30 seconds"
    return 1
}

# Function to check prerequisites
check_prerequisites() {
    log $BLUE "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log $RED "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log $RED "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        log $RED "npm is not installed."
        exit 1
    fi
    
    # Check curl
    if ! command -v curl >/dev/null 2>&1; then
        log $RED "curl is not installed. Please install curl first."
        exit 1
    fi
    
    log $GREEN "All prerequisites satisfied"
}

# Function to install dependencies
install_dependencies() {
    log $BLUE "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        log $GREEN "Dependencies already installed"
    fi
}

# Function to start server in background
start_server() {
    log $BLUE "Starting server..."
    
    # Kill any existing server on port 5000
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    
    # Start server in background
    npm run dev > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    wait_for_server
}

# Function to stop server
stop_server() {
    if [ -n "$SERVER_PID" ]; then
        log $BLUE "Stopping server..."
        kill $SERVER_PID 2>/dev/null || true
        pkill -f "npm run dev" 2>/dev/null || true
        pkill -f "tsx server/index.ts" 2>/dev/null || true
    fi
}

# Function to run all tests
run_all_tests() {
    log $BLUE "Running comprehensive test suite..."
    
    # Health check tests
    log $YELLOW "Testing health endpoint..."
    run_test "Health check" "test_api '/health'"
    
    # Notices CRUD tests
    log $YELLOW "Testing notices API..."
    run_test "GET notices" "test_api '/notices'"
    
    local notice_data='{"title":"Test Notice","content":"Test content","priority":"high","startDate":"2025-01-01T00:00:00.000Z","endDate":"2025-01-02T00:00:00.000Z","active":true}'
    run_test "POST notice" "test_api '/notices' 'POST' '200' '$notice_data'"
    
    # Documents CRUD tests
    log $YELLOW "Testing documents API..."
    run_test "GET documents" "test_api '/documents'"
    
    local doc_data='{"title":"Test Doc","url":"/test.pdf","type":"plasa","active":true}'
    run_test "POST document" "test_api '/documents' 'POST' '200' '$doc_data'"
    
    # Frontend tests
    log $YELLOW "Testing frontend pages..."
    run_test "Main page" "curl -s http://localhost:5000 | grep -q 'Marinha do Brasil'"
    run_test "Admin page" "curl -s http://localhost:5000/admin | grep -q 'html'"
    
    # Error handling tests
    log $YELLOW "Testing error handling..."
    run_test "404 handling" "test_api '/invalid-endpoint' 'GET' '404'"
    
    # Display test results
    echo
    log $BLUE "Test Results Summary"
    log $BLUE "===================="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Success Rate: ${success_rate}%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log $GREEN "All tests passed! System is working correctly."
        return 0
    else
        log $RED "Some tests failed. Check server.log for details."
        return 1
    fi
}

# Cleanup function
cleanup() {
    stop_server
    rm -f server.log
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    log $BLUE "Navy Display System - Automated Test Suite"
    log $BLUE "=========================================="
    
    check_prerequisites
    install_dependencies
    start_server
    
    if run_all_tests; then
        exit 0
    else
        exit 1
    fi
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quick, -q    Run quick tests only"
        echo "  --verbose, -v  Verbose output"
        exit 0
        ;;
    --quick|-q)
        log $YELLOW "Running quick tests..."
        # Add quick test implementation here
        ;;
    --verbose|-v)
        set -x
        ;;
esac

# Run main function
main "$@"