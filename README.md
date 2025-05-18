# AliveHuman

A comprehensive platform with web, admin, and mobile applications built on a monorepo architecture.

## Project Structure

This project is organized as a monorepo using Yarn Workspaces with the following main packages:

- **backend**: NestJS application with modular architecture
- **frontend**: Next.js application with modern structure
- **admin**: Next.js admin dashboard
- **mobile**: React Native mobile application
- **shared**: Common code and utilities

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- Yarn (>= 3.x)
- Docker and Docker Compose

### Installation

```bash
# Install dependencies
yarn install

# Start development environment
yarn dev
```

## Development

Each package can be developed independently:

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

## Documentation

Detailed documentation is available in the `Doqs` directory:

- **Project Architecture**: `/Doqs/ProjectArchitecure`
- **Implementation Guides**: `/Doqs/prompts/1st`
- **Feature Details**: `/Doqs/prompts/detail`

## GitHub Integration

This project uses GitHub for version control and CI/CD:

- **CI Workflows**: Automated testing and linting on push/pull request
- **Dependabot**: Automated dependency updates
- **Pull Request Template**: Standard format for all contributions

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for new features
- Feature branches: Named as `feature/feature-name`
- Bugfix branches: Named as `bugfix/issue-description`

## Docker Support

For detailed documentation, see the Doqs directory.