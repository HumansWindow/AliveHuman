# Monorepo Setup Prompts

## Initial Root Setup

```prompt
Create a Yarn Workspaces monorepo setup for a full-stack application with the following packages:
- backend (NestJS)
- frontend (Next.js)
- admin (Next.js)
- shared (common code)
- mobile (React Native)

Include:
1. Root package.json with workspaces configuration and common dev dependencies
2. Base TypeScript configuration (tsconfig.json) with proper path aliases
3. ESLint and Prettier configuration
4. Git configuration (.gitignore, etc.)
5. Base Jest testing setup
6. Yarn configuration for efficient dependency management
```

## Shared Package Setup

```prompt
Create a shared package within a Yarn workspace monorepo that will contain common code between a NestJS backend, Next.js frontend, and admin dashboard. The package should include:

1. TypeScript configuration with proper exports
2. Structure for shared:
   - Types/interfaces for users, authentication, API responses
   - Utility functions (formatting, validation, encryption)
   - Constants (API paths, error codes)
   - Base configuration options

3. Package.json with minimal dependencies
4. Testing setup for shared utilities
5. Proper export structure for both ESM and CommonJS to support both frontend and backend
```

## Docker Development Environment

```prompt
Create Docker configuration files for a monorepo project with:
1. Main docker-compose.yml with services for:
   - PostgreSQL database
   - Redis cache
   - NestJS backend (with hot reloading)
   - Next.js frontend (with hot reloading)
   - Next.js admin dashboard (with hot reloading)

2. Dockerfile for the backend service with:
   - Node 20 Alpine base image
   - Proper caching of dependencies
   - Development mode with hot reloading
   - Production build option

3. Dockerfile for the frontend services with:
   - Node 20 Alpine base image
   - Proper caching of dependencies
   - Development mode with hot reloading
   - Production build option

4. Environment configuration and example files
5. Docker networking setup for service communication
6. Volume configurations for persistent data
```

## Development Scripts

```prompt
Create development utility scripts for a Yarn workspace monorepo project:

1. A setup.sh script that:
   - Installs dependencies
   - Sets up environmental files
   - Initializes git hooks
   - Configures local development environment

2. A build.sh script that:
   - Builds all packages in the correct order
   - Performs type checking and linting
   - Creates optimized production builds

3. A test.sh script for running:
   - Unit tests
   - Integration tests
   - End-to-end tests
   - Code coverage reporting

4. A deploy.sh script for:
   - Building production assets
   - Running pre-deployment checks
   - Handling deployment to specified environments

All scripts should be compatible with both Linux and macOS environments.
```

## Yarn Workspace Setup

```prompt
Create a monorepo project structure for a web3 educational platform with Yarn workspaces with:

1. Root configuration:
   - package.json with workspace definitions
   - TypeScript configuration
   - ESLint and Prettier setup
   - Husky pre-commit hooks
   - Jest configuration
   - Build and development scripts

2. Workspace packages:
   - backend (NestJS application)
   - frontend (Next.js application)
   - mobile (React Native application)
   - admin (Admin dashboard)
   - common (Shared utilities and types)
   - contracts (Smart contracts and blockchain code)
   - blockchain (Blockchain integration libraries)

3. Root scripts for:
   - Development setup
   - Testing
   - Building
   - Deployment
   - Database migrations
   - Seeding

4. Configuration for CI/CD integration
5. Documentation for workspace usage
```

## Smart Contract Package

```prompt
Create a Smart Contract package within a Yarn workspace monorepo at 'packages/contracts' with:

1. Project setup:
   - Hardhat development environment
   - TypeScript configuration
   - OpenZeppelin contract dependencies
   - Ethers.js for testing and deployment
   - Solidity compiler configuration

2. Custom ERC20 token contract:
   - Standard ERC20 functionality
   - Minting capabilities for rewards
   - Transfer restrictions if needed
   - Pausable functionality
   - Role-based access control

3. Custom NFT (ERC721) contracts:
   - Achievement NFTs
   - Utility NFTs for platform features
   - Metadata handling
   - Minting functions

4. Test environment:
   - Local Hardhat network configuration
   - Test helpers and utilities
   - Comprehensive test suite

5. Deployment scripts:
   - Multi-network deployment support
   - Contract verification
   - Post-deployment setup

6. Documentation:
   - Contract documentation
   - Usage examples
   - ABI outputs for frontend integration
```

## Common Package

```prompt
Create a Common package within a Yarn workspace monorepo at 'packages/common' with:

1. Shared TypeScript types and interfaces:
   - User and profile types
   - Authentication types
   - API response types
   - Blockchain interaction types
   - Game and achievement types

2. Shared utilities:
   - Date and time formatting
   - Number formatting
   - String manipulation
   - Type guards and validation
   - Crypto utilities

3. Constants:
   - API endpoints
   - Error codes
   - Contract addresses by network
   - Configuration constants
   - Feature flags

4. Testing utilities:
   - Test data generators
   - Mock factories
   - Test helpers

5. Documentation:
   - API documentation
   - Type documentation
   - Usage examples
```

## Docker Setup

```prompt
Create Docker configuration for a web3 educational platform monorepo with:

1. Development environment:
   - docker-compose.yml for local development
   - Dockerfiles for each workspace package
   - Environment variable handling
   - Volume mounting for hot reloading
   - Local database and Redis services

2. Production environment:
   - Multi-stage builds for optimized images
   - Production-ready docker-compose.yml
   - Environment variable handling
   - Appropriate security practices

3. CI/CD configuration:
   - Docker image build workflows
   - Image tagging strategy
   - Registry configuration

4. Services:
   - PostgreSQL database
   - Redis for caching and queues
   - Backend service
   - Frontend service
   - Blockchain node connections
   - Admin dashboard service
   - Traefik or Nginx for routing

5. Documentation:
   - Setup instructions
   - Environment variable reference
   - Deployment guidelines
```

## Development Tooling

```prompt
Set up development tooling for a web3 educational platform monorepo with:

1. ESLint configuration:
   - TypeScript support
   - React/Next.js plugins
   - NestJS plugins
   - Custom rules
   - Integration with Prettier

2. Prettier configuration:
   - Code formatting rules
   - Integration with IDE plugins
   - Pre-commit hooks

3. Git hooks with Husky:
   - Pre-commit linting and formatting
   - Pre-push testing
   - Commit message validation

4. Testing framework:
   - Jest configuration
   - React Testing Library setup
   - E2E testing with Cypress or Playwright
   - API testing with Supertest
   - Smart contract testing with Hardhat

5. CI/CD workflows:
   - GitHub Actions or similar
   - Build and test jobs
   - Deployment jobs
   - Release management

6. Documentation:
   - Setup instructions
   - Tooling reference
   - Contribution guidelines
```

## Environment Configuration

```prompt
Create environment configuration for a web3 educational platform monorepo with:

1. Environment variable setup:
   - .env file templates
   - Environment-specific configurations
   - Secret management strategies
   - Validation utilities

2. Configuration for different environments:
   - Development
   - Testing
   - Staging
   - Production

3. Blockchain network configuration:
   - Network RPC endpoints
   - Contract addresses by network
   - Block explorer URLs
   - Chain IDs

4. Sensitive data handling:
   - Private key management (for hot wallets)
   - API key storage
   - JWT secret management
   - Database credentials

5. Configuration documentation:
   - Environment variable reference
   - Setup instructions
   - Security guidelines
```