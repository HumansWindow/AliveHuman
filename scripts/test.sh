#!/bin/bash

# AliveHuman Project Test Script
# This script runs tests for all packages

set -e

# Parse arguments
COVERAGE=false
WATCH=false
PACKAGE=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --coverage) COVERAGE=true ;;
    --watch) WATCH=true ;;
    --package=*) PACKAGE="${1#*=}" ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Run tests based on parameters
if [ -n "$PACKAGE" ]; then
  # Run tests for a specific package
  echo "Running tests for @alive-human/$PACKAGE..."
  
  TEST_CMD="yarn workspace @alive-human/$PACKAGE test"
  
  if [ "$WATCH" = true ]; then
    TEST_CMD="$TEST_CMD --watch"
  fi
  
  if [ "$COVERAGE" = true ]; then
    TEST_CMD="$TEST_CMD --coverage"
  fi
  
  eval $TEST_CMD
else
  # Run tests for all packages
  echo "Running tests for all packages..."
  
  TEST_CMD="yarn workspaces foreach -p run test"
  
  if [ "$COVERAGE" = true ]; then
    TEST_CMD="$TEST_CMD --coverage"
  fi
  
  eval $TEST_CMD
  
  # Combine coverage reports if coverage is enabled
  if [ "$COVERAGE" = true ]; then
    echo "Generating combined coverage report..."
    # Add command to combine coverage reports here
  fi
fi

echo "Tests completed!"