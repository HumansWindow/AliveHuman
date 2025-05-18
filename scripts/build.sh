#!/bin/bash

# AliveHuman Project Build Script
# This script builds all packages in the correct order

set -e

# Display welcome message
echo "Building AliveHuman packages..."

# Parse arguments
PRODUCTION=false
LINT=true
TYPE_CHECK=true

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --production) PRODUCTION=true ;;
    --no-lint) LINT=false ;;
    --no-type-check) TYPE_CHECK=false ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Set environment
if [ "$PRODUCTION" = true ]; then
  echo "Building for production..."
  export NODE_ENV=production
else
  echo "Building for development..."
  export NODE_ENV=development
fi

# Clean previous builds
echo "Cleaning previous builds..."
yarn workspaces foreach -p run clean

# Type checking
if [ "$TYPE_CHECK" = true ]; then
  echo "Running type checking..."
  yarn tsc --noEmit
fi

# Linting
if [ "$LINT" = true ]; then
  echo "Running linting..."
  yarn lint
fi

# Build packages in the correct order
echo "Building shared package..."
yarn workspace @alive-human/shared build

echo "Building backend package..."
yarn workspace @alive-human/backend build

echo "Building frontend package..."
yarn workspace @alive-human/frontend build

echo "Building admin package..."
yarn workspace @alive-human/admin build

echo "Build complete!"

# Production specific steps
if [ "$PRODUCTION" = true ]; then
  echo "Running production optimizations..."
  # Add any production specific build steps here
  
  echo "Production build completed successfully!"
fi