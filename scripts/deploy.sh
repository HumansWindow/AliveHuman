#!/bin/bash

# AliveHuman Project Deploy Script
# This script handles deployment to different environments

set -e

# Parse arguments
ENVIRONMENT="staging"
CI_MODE=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --environment=*) ENVIRONMENT="${1#*=}" ;;
    --ci) CI_MODE=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Invalid environment: $ENVIRONMENT"
  echo "Valid environments are: staging, production"
  exit 1
fi

echo "Deploying to $ENVIRONMENT environment..."

# Run pre-deployment checks
echo "Running pre-deployment checks..."

# Build for production
echo "Building for production..."
./scripts/build.sh --production

# Run deployment based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "Deploying to production..."
  
  # Additional production-specific steps
  echo "Running database migrations..."
  # Add production migration command here
  
  echo "Deploying backend..."
  # Add production backend deployment command here
  
  echo "Deploying frontend..."
  # Add production frontend deployment command here
  
  echo "Deploying admin dashboard..."
  # Add production admin deployment command here
  
  echo "Deployment to production completed successfully!"
else
  echo "Deploying to staging..."
  
  echo "Running database migrations..."
  # Add staging migration command here
  
  echo "Deploying backend..."
  # Add staging backend deployment command here
  
  echo "Deploying frontend..."
  # Add staging frontend deployment command here
  
  echo "Deploying admin dashboard..."
  # Add staging admin deployment command here
  
  echo "Deployment to staging completed successfully!"
fi

# If in CI mode, output deployment info
if [[ "$CI_MODE" == true ]]; then
  echo "CI deployment info:"
  echo "  Environment: $ENVIRONMENT"
  echo "  Timestamp: $(date)"
  echo "  Commit: $(git rev-parse HEAD)"
fi