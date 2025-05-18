# Frontend Implementation Prompts

## React Project Setup with Next.js

```prompt
Create a Next.js application within a Yarn workspace monorepo structure at 'packages/frontend' with:

1. Next.js 14+ with App Router architecture
2. TypeScript configuration extending the root config
3. Package.json with:
   - React and Next.js dependencies
   - State management (Redux Toolkit or Zustand)
   - Web3 libraries (ethers.js or web3.js)
   - Wagmi and RainbowKit for wallet connections
   - UI components (either custom or Tailwind-based library)
   - Form handling (React Hook Form + Zod)
   - Internationalization libraries
   - Testing utilities (Jest, React Testing Library)

4. Project structure following best practices
5. Environment configuration
6. SEO optimization setup
7. Analytics integration preparation
8. Error handling and monitoring
9. Performance optimization configuration
```

## Authentication Features

```prompt
Create a comprehensive web3 authentication system for a Next.js application with:

1. Web3 wallet connection features:
   - Multiple wallet provider support (MetaMask, WalletConnect, Coinbase Wallet)
   - Wallet connection state management
   - Message signing for authentication
   - Wallet address validation and display

2. Authentication flow:
   - Connect wallet button and modal
   - Sign message process
   - Token storage and refresh handling
   - Protected routes with authentication guards
   - Session persistence across page refreshes

3. User profile components:
   - Wallet information display
   - Optional email registration and verification
   - Profile editing capabilities
   - Account settings

4. Security features:
   - Token expiration handling
   - Secure storage of authentication tokens
   - CSRF protection
   - Device management UI

5. Complete test coverage
```

## User Dashboard

```prompt
Create a user dashboard for a Next.js application with:

1. Layout with:
   - Responsive sidebar navigation
   - Header with user wallet information and balance
   - Notification center
   - Main content area with breadcrumbs

2. Dashboard sections:
   - Overview with key metrics
   - Profile management
   - Wallet and token information
   - Activity history
   - Achievement progress
   - Game access

3. Features:
   - Real-time updates using WebSockets
   - Data visualization components for metrics
   - Progressive disclosure of features based on user progress
   - Responsive design for all device sizes

4. Performance optimization:
   - Component code splitting
   - Skeleton loading states
   - Virtualized lists for large datasets
   - Memoization of expensive calculations

5. Complete test coverage
```

## Wallet Integration Components

```prompt
Create wallet integration components for a Next.js application with:

1. Wallet connection components:
   - Connect wallet button
   - Wallet selection modal
   - Connected wallet status display
   - Account switcher
   - Network selector with chain validation

2. Token management components:
   - Token balance display
   - Token transaction history
   - Token transfer interface
   - NFT gallery and management

3. Blockchain interaction components:
   - Transaction status monitoring
   - Gas estimation utilities
   - Transaction confirmation modals
   - Contract interaction utilities

4. Features:
   - Multi-chain support
   - Real-time balance updates
   - Transaction notifications
   - Error handling for failed transactions
   - Mobile-responsive design

5. Complete test coverage
```

## Game Interface

```prompt
Create game interface components for a Next.js application with:

1. Game navigation:
   - Module selection interface
   - Progress tracking visualization
   - Achievement display
   - Unlockable content indicators

2. Game components:
   - Interactive lesson components
   - Quiz and challenge interfaces
   - Feedback and reward animations
   - Progress indicators

3. Reward system:
   - Token reward display
   - NFT collection showcase
   - Achievement badges
   - Leaderboard integration

4. Features:
   - Engaging animations and transitions
   - Audio feedback system
   - Accessibility considerations
   - Progress saving and resumption
   - Offline capability where appropriate

5. Complete test coverage
```

## Notifications System

```prompt
Create a notifications system for a Next.js application with:

1. Notification components:
   - Toast notifications
   - Notification center/inbox
   - Real-time notification indicators
   - Read/unread status management

2. WebSocket integration:
   - Connection management
   - Reconnection strategies
   - Event handling for different notification types

3. Notification types:
   - System notifications
   - Transaction updates
   - Game achievements
   - Token reward notifications
   - User interaction notifications

4. Features:
   - Notification preferences management
   - Grouping and categorization
   - Mark as read functionality
   - Clear and delete options
   - Mobile push notification integration

5. Complete test coverage
```

## Internationalization Setup

```prompt
Create an internationalization system for a Next.js application with:

1. Setup:
   - Integration with Next.js internationalization
   - Language detection and selection
   - Language switching UI
   - RTL support for appropriate languages

2. Translation management:
   - JSON-based translation files
   - Dynamic loading of translations
   - Fallback handling
   - Translation key organization

3. Formatting utilities:
   - Date and time formatting
   - Number and currency formatting
   - Pluralization rules
   - Unit conversions

4. Features:
   - SEO optimization for multi-language content
   - Language preferences persistence
   - Content adaptation based on locale
   - Translation coverage reporting

5. Complete test coverage
```