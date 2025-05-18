# Getting Started with AliveHuman

This guide will help you set up and run the AliveHuman project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.x or later)
- **Yarn** (v3.x or later)
- **Docker** and **Docker Compose** (for local development environment)
- **Git** (for version control)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AliveHuman/AliveHuman.git
   cd AliveHuman
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   Copy the example environment files for each package:

   ```bash
   cp packages/backend/.env.example packages/backend/.env
   cp packages/frontend/.env.example packages/frontend/.env
   cp packages/admin/.env.example packages/admin/.env
   ```

4. **Start the development environment**

   ```bash
   # Start the Docker services (PostgreSQL, Redis, etc.)
   docker-compose up -d

   # Start all packages in development mode
   yarn dev
   ```

## Development Workflow

The project uses a monorepo structure with Yarn Workspaces. You can work on individual packages:

```bash
# Backend development
yarn workspace @alive-human/backend dev

# Frontend development
yarn workspace @alive-human/frontend dev

# Admin dashboard development
yarn workspace @alive-human/admin dev

# Mobile development
yarn workspace @alive-human/mobile dev
```

## Git Workflow

We follow the Git Flow workflow with some modifications:

1. **Main Branches**:
   - `main`: Production-ready code
   - `develop`: Integration branch for new features

2. **Feature Development**:
   ```bash
   # Create a new feature branch
   yarn git:feature my-feature-name

   # Work on your feature, then commit and push
   git add .
   git commit -m "feat(scope): description of changes"
   git push -u origin feature/my-feature-name
   ```

3. **Bug Fixes**:
   ```bash
   # Create a new bugfix branch
   yarn git:bugfix issue-description

   # Fix the bug, then commit and push
   git add .
   git commit -m "fix(scope): description of fix"
   git push -u origin bugfix/issue-description
   ```

4. **Create Pull Request**:
   ```bash
   # After pushing your branch
   yarn git:pr feature/my-feature-name "Title of your PR"
   ```

## Testing

Run tests for all packages:

```bash
yarn test
```

Or for a specific package:

```bash
yarn workspace @alive-human/shared test
yarn workspace @alive-human/backend test
# etc.
```

## Linting and Formatting

We use ESLint and Prettier for code quality:

```bash
# Run linting for all packages
yarn lint

# Format code
yarn format
```

## Documentation

Please refer to the `Doqs` directory for detailed documentation on the project architecture, implementation guides, and feature details.

## Need Help?

If you have any questions or need help, please:
1. Check the project documentation in the `Doqs` directory
2. Open an issue on GitHub
3. Reach out to the project maintainers
