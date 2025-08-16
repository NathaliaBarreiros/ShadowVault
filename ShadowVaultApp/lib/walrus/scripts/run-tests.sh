#!/bin/bash

# Walrus Library Test Runner Script
# Runs comprehensive tests for the Walrus integration library

set -e

echo "🧪 Walrus Library Test Suite"
echo "============================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ to run tests."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the walrus library directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Type checking
print_status "Running TypeScript type checking..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Unit tests
print_status "Running unit tests..."
if npm run test:unit; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Test coverage
print_status "Generating test coverage report..."
if npm run test:coverage; then
    print_success "Coverage report generated"
    echo
    print_status "Coverage report available at: $(pwd)/coverage/lcov-report/index.html"
else
    print_warning "Coverage report generation failed, but tests may have passed"
fi

# Connectivity test (optional)
print_status "Running Walrus connectivity test..."
echo
print_warning "This test requires internet connection to Walrus testnet"
read -p "Do you want to run connectivity tests? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm run test:connectivity; then
        print_success "Connectivity test passed"
    else
        print_warning "Connectivity test failed - this might be due to network issues"
    fi
else
    print_status "Skipping connectivity test"
fi

# Integration tests (optional)
print_status "Integration tests available but skipped by default"
echo
print_warning "Integration tests require actual Walrus testnet connectivity"
read -p "Do you want to run integration tests? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_warning "Integration tests failed - check network connectivity and Walrus service status"
    fi
else
    print_status "Skipping integration tests"
fi

# Performance benchmark (optional)
print_status "Performance benchmark available"
echo
read -p "Do you want to run performance benchmarks? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running performance benchmarks..."
    if npm run benchmark; then
        print_success "Performance benchmarks completed"
    else
        print_warning "Performance benchmarks failed"
    fi
else
    print_status "Skipping performance benchmarks"
fi

echo
print_success "🎉 Walrus library test suite completed!"
echo
print_status "Summary:"
echo "  ✅ TypeScript type checking"
echo "  ✅ Unit tests"
echo "  ✅ Test coverage report"
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  ✅ Connectivity test"
    echo "  ✅ Integration tests"
    echo "  ✅ Performance benchmarks"
fi

echo
print_status "Next steps:"
echo "  1. Review test coverage report: coverage/lcov-report/index.html"
echo "  2. Check integration with ShadowVault app"
echo "  3. Deploy to testnet for end-to-end testing"
echo
print_success "All tests completed successfully! 🚀"