# Code Organization Standards

This document outlines the standards for organizing code in the AliveHuman monorepo to avoid duplication and maintain consistency.

## Package Responsibilities

### Shared Package

The shared package (`packages/shared`) contains:

- Common types, interfaces, and DTOs used across packages
- API client code and request/response types 
- Utility functions for common tasks
- Constants and configurations
- Blockchain interface definitions and common utilities

**Do not include in shared package:**
- Backend-specific implementations
- UI components or UI-specific code
- Server-side business logic

### Backend Package

The backend package (`packages/backend`) contains:

- API controllers and routes
- Server-side business logic and services
- Database entities and relationships
- Authentication implementation
- Blockchain transaction processing and server-side operations

### Frontend/Admin/Mobile Packages

These packages contain:
- UI components and pages
- State management
- Component-specific logic
- UI routing and navigation

## Code Duplication Guidelines

1. **Types and Interfaces**: Define once in shared package
2. **API Endpoints**: Define route constants in shared
3. **Business Logic**: 
   - Backend-specific logic stays in backend
   - Frontend-specific logic stays in frontend/admin/mobile
   - Common logic (e.g., validation) goes in shared

## Import Guidelines

1. Always import from shared package using the package name:
   ```typescript
   import { UserDto } from '@alive-human/shared';
   ```

2. Do not import directly between frontend, backend, admin, or mobile packages.

## Development Workflow

1. When making changes to shared types:
   - Update the shared package first
   - Run build on shared package
   - Then update the consuming packages

2. When adding new features:
   - Define shared types in shared package
   - Implement backend functionality
   - Implement frontend/admin/mobile UI

## Examples

### Good Example - Auth Feature

**In shared package:**
```typescript
// packages/shared/src/models/auth/index.ts
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}
```

**In backend package:**
```typescript
// packages/backend/src/auth/controllers/auth.controller.ts
import { LoginDto, AuthResponse } from '@alive-human/shared';

@Post('login')
async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
  // Implementation
}
```

**In frontend package:**
```typescript
// packages/frontend/src/features/auth/login.ts
import { LoginDto, AuthResponse } from '@alive-human/shared';

async function loginUser(credentials: LoginDto): Promise<AuthResponse> {
  // Implementation using shared API client
}
```

### Bad Example - Duplicated Code

❌ **Don't do this:**
```typescript
// In backend
interface User {
  id: string;
  email: string;
}

// In frontend (duplicated)
interface User {
  id: string;
  email: string;
}
```

✅ **Do this instead:**
```typescript
// In shared
export interface User {
  id: string;
  email: string;
}

// In both backend and frontend
import { User } from '@alive-human/shared';
```

## Blockchain Code Organization

- Smart contract ABIs and interfaces → shared package
- Contract deployment/interaction logic → backend package
- Wallet connection UI → frontend/mobile packages
- Transaction signing helpers → shared package
