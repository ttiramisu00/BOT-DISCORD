# Discord Job Tracker Bot

## Overview

This is a full-stack Discord bot application designed to track job completions within Discord servers. The system consists of a React frontend dashboard for monitoring bot statistics and recent activities, and an Express.js backend that manages the Discord bot functionality and data persistence. Users can interact with the bot using commands and buttons to log job completions, which are then tracked and displayed in real-time through the web dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.
International client support: All Discord commands and interface in English.
Leveling system: 2 jobs per level up (changed from 1 job back to 2 jobs per user request).
Custom celebration GIF: Using provided anime-style "Good Job" GIF for level-up celebrations.
Enhanced job tracking: Integrated /taken and /leaderboard commands with detailed statistics.
Professional messaging: Updated all Discord messages to be more comprehensive and informative.
Comprehensive command suite: Added 9 new commands for complete client management system.
International support: All commands and messages now use English for international clients.
Channel routing: /feedback posts to #client-feedback, /order posts to #order-list as requested.
Final comprehensive upgrade: Fixed all deprecation warnings, enhanced deadline parsing, improved portfolio links, and ensured perfect functionality across all 13 commands.

## System Architecture

**Frontend Architecture**
- Built with React 18 and TypeScript using Vite as the build tool
- UI components based on Radix UI primitives with shadcn/ui styling system
- State management handled by TanStack Query for server state and React hooks for local state
- Styling implemented with Tailwind CSS using CSS variables for theming
- Client-side routing managed by Wouter for lightweight navigation
- Responsive design with mobile-first approach using custom hooks for device detection

**Backend Architecture**
- Express.js server with TypeScript support for type safety
- RESTful API design with endpoints for bot statistics, job completions, and bot management
- Modular service architecture separating Discord bot logic from HTTP handling
- Memory-based storage implementation with interface for future database integration
- Middleware for request logging, JSON parsing, and error handling
- Development-only Vite integration for hot module replacement

**Discord Bot Integration**
- Discord.js v14 for bot functionality with proper intent configuration
- Event-driven architecture handling message creation and button interactions
- Job completion tracking through interactive buttons in Discord channels
- Automatic streak channel detection and notification system
- Bot statistics collection including server count, active users, and uptime metrics
- Complete leveling system: 2 jobs = 1 level up with celebration effects and custom GIF
- Enhanced job tracking system with three-button workflow: taken by artist, update progress, completed
- Comprehensive leaderboard with detailed statistics: completed jobs, taken jobs, in-progress jobs, team efficiency
- Thirteen comprehensive slash commands in English: /job, /leaderboard, /taken, /template, /order, /status, /quote, /claim, /feedback, /portfolio, /clientlist, /rules, /info
- Complete client order management system with order tracking, status updates, and automated notifications
- Professional Discord messaging with progress bars, statistics, and motivational elements
- International client support with English language interface
- Advanced order system with deadline parsing, automatic channel posting, and client feedback collection

**Data Management**
- Drizzle ORM configured for PostgreSQL with migration support
- Schema definitions for users, job completions, job taken tracking, orders, client feedback, and bot statistics
- Zod validation schemas for type-safe data operations
- Current implementation uses in-memory storage with interface for database integration
- Data models include user management, job tracking, job status management, order management, client feedback, and bot metrics
- Enhanced statistics tracking for comprehensive performance monitoring
- Complete order lifecycle management with status tracking and client relationship mapping

**Development Workflow**
- TypeScript configuration with strict mode and ESNext modules
- Development server with hot reload and error overlay
- Build process using Vite for frontend and esbuild for backend
- Path aliases configured for clean imports across client and shared modules
- Replit-specific development tools and deployment configuration

## External Dependencies

**Core Frameworks**
- Express.js for backend HTTP server and API routing
- React with TypeScript for frontend user interface
- Discord.js for Discord bot functionality and API integration

**Database and ORM**
- Drizzle ORM for database operations and schema management
- PostgreSQL as the target database (configured but not yet implemented)
- Neon Database serverless driver for cloud database connectivity

**UI and Styling**
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling and responsive design
- Lucide React for consistent iconography throughout the application

**State Management and Data Fetching**
- TanStack Query for server state management and caching
- React Hook Form with Zod resolvers for form validation
- Date-fns for date manipulation and formatting

**Development Tools**
- Vite for fast development server and optimized builds
- TypeScript for type safety across the entire application
- PostCSS with Autoprefixer for CSS processing and vendor prefixes