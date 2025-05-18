#!/bin/bash

# AliveHuman Project Setup Script
# This script initializes the development environment

set -e

# Display welcome message
echo "Setting up AliveHuman development environment..."

# Check for required tools
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo "Yarn is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting."; exit 1; }

# Install dependencies
echo "Installing dependencies..."
yarn install

# Copy environment files
echo "Setting up environment files..."
for pkg in backend frontend admin mobile; do
  if [ -f "packages/$pkg/.env.example" ] && [ ! -f "packages/$pkg/.env" ]; then
    cp "packages/$pkg/.env.example" "packages/$pkg/.env"
    echo "Created .env file for $pkg"
  fi
done

# Set up Git hooks
echo "Setting up Git hooks..."
yarn husky install || echo "Husky not configured, skipping Git hooks setup"

# Initialize basic workspace
echo "Building shared package..."
yarn workspace @alive-human/shared build

echo "Setting up database..."
# Ensure Docker is running
docker-compose up -d postgres

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

echo "Setup complete! You can now start the development environment with:"
echo "  - yarn dev              # Start all packages"
echo "  - docker-compose up     # Start with Docker"
echo ""
echo "Or start individual packages with:"
echo "  - yarn workspace @alive-human/backend dev"
echo "  - yarn workspace @alive-human/frontend dev"
echo "  - yarn workspace @alive-human/admin dev"
echo "  - yarn workspace @alive-human/mobile dev"