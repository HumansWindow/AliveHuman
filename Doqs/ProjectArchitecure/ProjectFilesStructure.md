# AliveHuman Project Files Structure

This document outlines the standardized file structure for the AliveHuman project monorepo. It serves as a reference for developers working on the project and ensures consistency across all packages.

## Monorepo Root Structure

```
AliveHuman/
├── .github/                       # GitHub workflows and templates
│   └── workflows/                 # CI/CD pipeline configurations
├── .vscode/                       # VS Code workspace settings
├── docker/                        # Docker compose services config
├── node_modules/                  # Root dependencies (managed by Yarn Workspaces)
├── packages/                      # Workspace packages
│   ├── admin/                     # Admin dashboard (Next.js)
│   ├── backend/                   # Backend API service (NestJS)
│   ├── frontend/                  # User-facing web app (Next.js)
│   ├── mobile/                    # Mobile application (React Native)
│   └── shared/                    # Shared code and utilities
├── scripts/                       # Project management scripts
│   ├── build.sh                   # Build script for all packages
│   ├── deploy.sh                  # Deployment automation script
│   ├── setup.sh                   # Initial project setup script
│   └── test.sh                    # Test runner for all packages
├── CodeOrganizationStandards.md   # Standards for code organization and avoiding duplication
├── docker-compose.yml             # Development environment configuration
├── Dockerfile.admin               # Admin dashboard Docker build
├── Dockerfile.backend             # Backend Docker build
├── Dockerfile.frontend            # Frontend Docker build
├── package.json                   # Root package with workspaces config
├── README.md                      # Project overview documentation
├── tsconfig.json                  # Base TypeScript configuration
└── yarn.lock                      # Yarn dependency lock file
```

## Shared Package Structure (Implemented)

```
packages/shared/
├── dist/                          # Compiled output
├── node_modules/                  # Package dependencies
├── src/
│   ├── api/                       # API client utilities
│   │   ├── http/                  # HTTP client for API requests
│   │   │   └── index.ts           # HTTP client implementation
│   │   └── websocket/             # WebSocket client for real-time
│   │       └── index.ts           # WebSocket client implementation
│   ├── blockchain/                # Blockchain utilities
│   │   ├── contracts/             # Smart contract interfaces
│   │   ├── index.ts               # Blockchain exports ✅
│   │   ├── polygon.ts             # Polygon-specific utilities ✅
│   │   │   - isPolygonNetwork     # Network detection function
│   │   │   - POLYGON_PARAMS       # Network parameters
│   │   │   - switchToPolygon      # Network switching function
│   │   ├── tokens/                # Token utilities
│   │   └── wallet.ts              # Wallet connection utilities
│   ├── config/                    # Configuration utilities
│   │   └── environment.ts         # Environment configuration
│   ├── constants/                 # Shared constants
│   │   ├── api/                   # API endpoints
│   │   │   └── index.ts           # API endpoint constants
│   │   └── app/                   # Application constants
│   │       └── index.ts           # App-wide constants
│   ├── hooks/                     # Shared React hooks (for frontend/admin)
│   ├── i18n/                      # Internationalization utilities
│   ├── models/                    # Shared type definitions and interfaces
│   │   ├── auth/                  # Authentication types
│   │   │   ├── index.ts           # Auth models and interfaces ✅
│   │   │   └── web3-auth.ts       # Web3 authentication models ✅
│   │   │       - DeviceFingerprint    # Device identification interface
│   │   │       - LocationData         # Geolocation tracking interface
│   │   │       - UserSession          # Session management interface
│   │   │       - Web3AuthDto          # Auth request/response DTOs
│   │   │       - RefreshTokenDto      # Token refresh DTOs
│   │   ├── diary/                 # Diary feature types
│   │   │   └── index.ts           # Diary models and interfaces
│   │   ├── game/                  # Game feature types
│   │   │   └── index.ts           # Game models and interfaces
│   │   ├── responses/             # API response types
│   │   │   └── index.ts           # API response models
│   │   └── user/                  # User-related types
│   │       └── index.ts           # User models and interfaces
│   ├── utils/                     # Utility functions
│   │   ├── date/                  # Date manipulation utilities
│   │   │   └── index.ts           # Date utility functions
│   │   ├── formatting/            # Text/number formatting utilities
│   │   │   └── index.ts           # Formatting utility functions
│   │   ├── storage/               # Storage utilities
│   │   │   └── index.ts           # Storage utility functions
│   │   └── validation/            # Form validation utilities
│   │       └── index.ts           # Validation utility functions
│   └── index.ts                   # Main export file
├── package.json                   # Package configuration
├── README.md                      # Package documentation
└── tsconfig.json                  # TypeScript configuration
```

## Backend Package Structure (To Be Implemented)

```
packages/backend/
├── dist/                          # Compiled output
├── node_modules/                  # Package dependencies
├── src/
│   ├── app.module.ts              # Main application module
│   ├── main.ts                    # Application entry point
│   ├── auth/                      # Authentication module
│   │   ├── controllers/           # Auth controllers
│   │   ├── dto/                   # Data transfer objects
│   │   ├── guards/                # Authentication guards
│   │   ├── strategies/            # Auth strategies (JWT, Web3, etc.)
│   │   ├── auth.module.ts         # Module definition
│   │   └── auth.service.ts        # Authentication business logic
│   ├── blockchain/                # Blockchain integration module
│   │   ├── controllers/           # Blockchain controllers
│   │   ├── dto/                   # Data transfer objects
│   │   ├── services/              # Blockchain services
│   │   └── blockchain.module.ts   # Module definition
│   ├── config/                    # Configuration module
│   │   ├── database.config.ts     # Database configuration
│   │   ├── auth.config.ts         # Auth configuration
│   │   └── app.config.ts          # Application configuration
│   ├── database/                  # Database-related files
│   │   ├── migrations/            # Database migrations
│   │   ├── seeds/                 # Database seeders
│   │   └── entities/              # TypeORM entities
│   ├── diary/                     # Diary feature module
│   │   ├── controllers/           # Diary controllers
│   │   ├── dto/                   # Data transfer objects
│   │   ├── entities/              # Diary-related entities
│   │   ├── diary.module.ts        # Module definition
│   │   └── diary.service.ts       # Diary business logic
│   ├── game/                      # Game feature module
│   │   ├── controllers/           # Game controllers
│   │   ├── dto/                   # Data transfer objects
│   │   ├── entities/              # Game-related entities
│   │   ├── game.module.ts         # Module definition
│   │   └── game.service.ts        # Game business logic
│   ├── notification/              # Notification module
│   │   ├── gateways/              # WebSocket gateways
│   │   ├── notification.module.ts # Module definition
│   │   └── notification.service.ts # Notification business logic
│   ├── referral/                  # Referral system module
│   ├── shared/                    # Backend-specific utilities (not to be confused with the @alive-human/shared package)
│   └── users/                     # User management module
│       ├── controllers/           # User controllers
│       ├── dto/                   # Data transfer objects
│       ├── entities/              # User entity
│       ├── users.module.ts        # Module definition
│       └── users.service.ts       # User business logic
├── test/                          # Testing files
├── .env                           # Environment variables
├── .env.example                   # Example environment configuration
├── package.json                   # Package configuration
├── README.md                      # Package documentation
└── tsconfig.json                  # TypeScript configuration
```

## Frontend Package Structure

```
packages/frontend/
├── node_modules/                  # Package dependencies
├── public/                        # Static assets
│   ├── assets/                    # Images, fonts, etc.
│   └── locales/                   # i18n translation files
├── src/
│   ├── api/                       # API integration
│   │   ├── hooks/                 # Custom API hooks
│   │   └── services/              # API service functions
│   ├── components/                # Reusable UI components
│   │   ├── auth/                  # Authentication components
│   │   ├── blockchain/            # Blockchain-related components
│   │   ├── diary/                 # Diary feature components
│   │   ├── game/                  # Game-related components
│   │   ├── layout/                # Layout components
│   │   ├── ui/                    # UI library components
│   │   └── user/                  # User-related components
│   ├── config/                    # Frontend configuration
│   ├── context/                   # React context providers
│   │   ├── AuthContext.tsx        # Authentication context
│   │   ├── BlockchainContext.tsx  # Blockchain context
│   │   └── ThemeContext.tsx       # Theme context
│   ├── hooks/                     # Custom React hooks
│   ├── pages/                     # Next.js pages
│   │   ├── _app.tsx               # Next.js app component
│   │   ├── _document.tsx          # Next.js document
│   │   ├── api/                   # API routes
│   │   ├── auth/                  # Authentication pages
│   │   ├── diary/                 # Diary feature pages
│   │   ├── game/                  # Game feature pages
│   │   ├── profile/               # User profile pages
│   │   └── index.tsx              # Homepage
│   ├── styles/                    # Styling files
│   ├── types/                     # Frontend-specific types
│   └── utils/                     # Utility functions
├── .env                           # Environment variables
├── .env.example                   # Example environment configuration
├── next.config.js                 # Next.js configuration
├── package.json                   # Package configuration
├── README.md                      # Package documentation
└── tsconfig.json                  # TypeScript configuration
```

## Admin Package Structure

```
packages/admin/
├── node_modules/                  # Package dependencies
├── public/                        # Static assets
├── src/
│   ├── api/                       # API integration
│   ├── components/                # Admin-specific components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── layout/                # Admin layout components
│   │   ├── management/            # Management interfaces
│   │   ├── stats/                 # Statistics components
│   │   └── ui/                    # UI components
│   ├── config/                    # Admin configuration
│   ├── context/                   # React context providers
│   ├── hooks/                     # Admin-specific hooks
│   ├── pages/                     # Next.js pages
│   │   ├── _app.tsx               # Next.js app component
│   │   ├── _document.tsx          # Next.js document
│   │   ├── api/                   # API routes
│   │   ├── auth/                  # Admin authentication
│   │   ├── content/               # Content management
│   │   ├── dashboard/             # Dashboard pages
│   │   ├── system/                # System management
│   │   ├── users/                 # User management
│   │   └── index.tsx              # Admin home
│   ├── styles/                    # Styling files
│   ├── types/                     # Admin-specific types
│   └── utils/                     # Utility functions
├── .env                           # Environment variables
├── .env.example                   # Example environment configuration
├── next.config.js                 # Next.js configuration
├── package.json                   # Package configuration
├── README.md                      # Package documentation
└── tsconfig.json                  # TypeScript configuration
```

## Mobile Package Structure

```
packages/mobile/
├── android/                       # Android native files
├── ios/                           # iOS native files
├── node_modules/                  # Package dependencies
├── src/
│   ├── api/                       # API integration
│   ├── assets/                    # App assets
│   ├── components/                # Reusable components
│   │   ├── auth/                  # Authentication components
│   │   ├── blockchain/            # Blockchain components
│   │   ├── diary/                 # Diary components
│   │   ├── game/                  # Game components
│   │   └── ui/                    # UI components
│   ├── config/                    # Mobile configuration
│   ├── context/                   # React context providers
│   ├── hooks/                     # Custom hooks
│   ├── navigation/                # Navigation configuration
│   ├── screens/                   # App screens
│   │   ├── auth/                  # Authentication screens
│   │   ├── diary/                 # Diary feature screens
│   │   ├── game/                  # Game screens
│   │   ├── home/                  # Home screen
│   │   ├── profile/               # Profile screens
│   │   └── settings/              # Settings screens
│   ├── services/                  # Mobile-specific services
│   ├── store/                     # State management
│   ├── styles/                    # Styling utilities
│   ├── types/                     # Mobile-specific types
│   └── utils/                     # Utility functions
├── .env                           # Environment variables
├── .env.example                   # Example environment configuration
├── app.json                       # React Native configuration
├── babel.config.js                # Babel configuration
├── index.js                       # Entry point
├── metro.config.js                # Metro bundler configuration
├── package.json                   # Package configuration
├── README.md                      # Package documentation
└── tsconfig.json                  # TypeScript configuration
```

## Implementation Progress

Based on the implementation guide and current progress, we have completed:

1. ✅ **Initial Monorepo Setup**
   - Basic directory structure with all necessary packages
   - Package configuration files (package.json, tsconfig.json)
   - Docker configuration files

2. ✅ **Shared Package Implementation**
   - Complete directory structure for the shared package
   - Core data models for users, authentication, diary, and game features
   - API response models for standardized communication
   - HTTP and WebSocket clients for API communication
   - Utility functions (date, formatting, validation, storage)
   - Environment configuration for consistent access across packages
   - Application constants and API endpoint definitions
   - Blockchain integration utilities

3. ✅ **Backend Structure Implementation**
   - Basic NestJS structure with module organization
   - Authentication module with Web3 support
   - Blockchain integration module with initial services
   - User management module with entity definitions
   - Configuration setup for different environments

4. ✅ **Frontend Initial Components**
   - Authentication components for Web3 login
   - Utility functions for device fingerprinting and session management
   - Folder structure for feature organization

5. ✅ **Code Organization Standards**
   - Created detailed guidelines for avoiding duplication
   - Established clear rules for what belongs in each package
   - Defined import patterns and development workflow
   - Provided examples of good and bad code organization practices

## Next Steps for Implementation

The immediate next tasks to focus on are:

1. ✅ **Initialize Git Repository**
   - Create a `.gitignore` file with appropriate exclusions
   - Initialize the repository
   - Make an initial commit with the current structure

2. ✅ **Fix Directory Structure**
   - Remove the duplicate AliveHuman folder
   - Ensure the structure matches this document

3. **Complete Backend Feature Modules**
   - Implement the diary feature module with CRUD operations
   - Develop the game feature module with integration points
   - Set up notification system with WebSocket support
   - Create referral system with tracking capabilities

4. **Frontend Feature Implementation**
   - Implement user profile and dashboard
   - Develop diary interface with blockchain integration
   - Create game interface with interactive elements
   - Build notification center for real-time updates

5. **Admin Dashboard Development**
   - Set up basic dashboard structure
   - Implement user management interface
   - Create content management system
   - Develop analytics and reporting views

6. **Mobile App Initial Setup**
   - Configure React Native environment
   - Implement authentication flow
   - Create basic navigation structure
   - Integrate with shared package utilities

## Directory Structure Validation Checklist

Current implementation status:

- [x] Shared package structure and core files implemented
- [x] Core data models defined in shared package
- [x] Utility functions implemented in shared package
- [x] API communication utilities created in shared package
- [x] Code Organization Standards document created
- [x] Backend structure setup with basic modules defined
- [x] Authentication module partially implemented with Web3 support
- [x] Blockchain module structure defined with initial services
- [ ] Complete backend implementation with all features (diary, game, etc.)
- [ ] Database connections fully configured
- [x] Cross-package imports configured
- [ ] Build scripts updated to work with the new structure

This file structure serves as the foundation for implementing all features described in the project documentation.