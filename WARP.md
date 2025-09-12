# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

KendineGöre is a comprehensive salon/beauty management SaaS application built with React + TypeScript + Vite + Supabase stack. It provides business management tools for salons including appointment scheduling, customer management, staff management, SMS integration, and public booking interfaces.

## Common Development Commands

### Development & Build
```bash
# Start development server (runs on localhost:8080)
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Install dependencies
npm i
```

### Database & Supabase
```bash
# Supabase CLI commands (if installed globally)
supabase start
supabase db reset
supabase db push
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui + Radix UI components
- **Styling**: Tailwind CSS with custom brand colors
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **SMS Integration**: NetGSM API

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── admin/           # Admin panel specific components
│   ├── appointments/    # Appointment management components
│   ├── customers/       # Customer management components
│   ├── dashboard/       # Main dashboard components
│   ├── expenses/        # Expense tracking components
│   └── staff/           # Staff management components
├── hooks/               # Custom React hooks
├── integrations/
│   └── supabase/        # Supabase client, types, and APIs
├── lib/                 # Utility libraries
├── pages/               # Route components
│   ├── dashboard/       # Business dashboard pages
│   └── admin/           # Admin panel pages
├── services/            # Business logic services
└── utils/               # Utility functions
```

### Key Application Areas

**Multi-tenant Architecture**
- Business dashboard (`/dashboard/*`) - Main business management interface
- Staff dashboard (`/staff-dashboard/*`) - Staff-specific interface  
- Admin panel (`/admin-*`) - System administration interface
- Public booking (`/randevu/:slug`) - Customer-facing booking interface

**Core Business Features**
- Appointment scheduling and management
- Customer database with SMS integration
- Staff management and permissions
- Service catalog and pricing
- Working hours configuration
- Payment tracking and expenses
- Online booking system with phone verification

**SMS Integration (NetGSM)**
- Phone verification for new bookings (6-digit codes, 10min expiry)
- Appointment reminder SMS (configurable timing)
- Business notifications (3 free daily SMS limit)
- SMS settings management and logging

### Database Layer
- Supabase PostgreSQL with Row Level Security (RLS)
- Type-safe database client via generated types
- Real-time subscriptions for live updates
- Migration files in `supabase/migrations/`

### Component Architecture
- shadcn/ui pattern with customizable components in `components/ui/`
- Path aliases configured: `@/*` maps to `src/*`
- Consistent component organization by feature area
- Custom Tailwind theme with brand colors and CSS variables

### Routing Structure
- Nested routing with protected routes
- Business slug-based public booking pages
- Role-based access (business owner, staff, admin)
- 404 handling with custom NotFound component

## Development Guidelines

### File Organization
- Components are organized by feature/domain
- Use index exports for cleaner imports
- Follow established naming conventions (PascalCase for components, camelCase for functions)

### State Management
- Use TanStack Query for server state
- Minimize local state, prefer server state when possible
- Custom hooks for complex state logic

### Styling
- Use Tailwind CSS classes following the existing patterns
- Custom brand colors are defined in tailwind.config.ts
- CSS variables for theming support (light/dark mode)

### API Integration
- All Supabase interactions go through organized API functions
- Type safety enforced via generated database types
- Error handling patterns established in existing code

### SMS Integration Usage
- SMS functionality uses NetGSM service
- Environment variables required: VITE_NETGSM_USERNAME, VITE_NETGSM_PASSWORD, VITE_NETGSM_HEADER
- Daily SMS limits and business rules implemented
- Comprehensive logging and error handling

## Environment Setup

### Required Environment Variables
```env
# NetGSM SMS Integration
VITE_NETGSM_USERNAME="your_username"
VITE_NETGSM_PASSWORD="your_password"
VITE_NETGSM_HEADER="your_header"
VITE_NETGSM_API_URL="https://api.netgsm.com.tr"
```

### Development Dependencies
- Node.js & npm (preferably via nvm)
- Supabase CLI (optional, for local development)
- Modern editor with TypeScript support

## Key Integrations

### Supabase Configuration
- Project URL: `https://vexsdrvhjlwupwzgfuqx.supabase.co`
- Authentication with localStorage persistence
- Auto-refresh tokens enabled
- RLS policies for multi-tenant security

### Lovable Integration
- Project managed via Lovable platform
- Automatic deployments on code changes
- Component tagging for development mode

## Testing Strategy
- No explicit test configuration found
- Follow React testing best practices if adding tests
- Consider integration testing for SMS workflows