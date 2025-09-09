# Next Doorcard - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 15)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Public Pages  │  │  Authenticated  │  │   Admin Pages   │            │
│  │                 │  │     Pages       │  │                 │            │
│  │ • Home (/)      │  │ • Dashboard     │  │ • User Mgmt     │            │
│  │ • Search        │  │ • Create Card   │  │ • Oversight     │            │
│  │ • View Cards    │  │ • Edit Cards    │  │ • Analytics     │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
├─────────────────────────────────────────────────────────────────────────────┤
│                           AUTHENTICATION LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        NextAuth.js v4                                   │ │
│  │  • Google OAuth        • Session Management    • Role-based Access     │ │
│  │  • Prisma Adapter      • JWT Tokens           • Admin/User Roles       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Public APIs   │  │  Protected APIs │  │   Admin APIs    │            │
│  │                 │  │                 │  │                 │            │
│  │ • GET /doorcards│  │ • POST /doorcard│  │ • GET /admin/*  │            │
│  │ • GET /search   │  │ • PUT /doorcard │  │ • DELETE /users │            │
│  │ • GET /health   │  │ • File uploads  │  │ • POST /bulk    │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           Prisma ORM                                    │ │
│  │  • Type-safe queries       • Migration system    • Schema management   │ │
│  │  • Connection pooling      • Query optimization  • Relationship mgmt   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL Database                             │ │
│  │                                                                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │    User     │ │  Account    │ │   Session   │ │ VerifyToken │      │ │
│  │  │             │ │             │ │             │ │             │      │ │
│  │  │ • id        │ │ • userId    │ │ • userId    │ │ • token     │      │ │
│  │  │ • email     │ │ • provider  │ │ • expires   │ │ • expires   │      │ │
│  │  │ • name      │ │ • tokens    │ │ • sessionId │ │             │      │ │
│  │  │ • role      │ │             │ │             │ │             │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  │                                    │                                   │ │
│  │  ┌─────────────┐ ┌─────────────┐   │   ┌─────────────┐                │ │
│  │  │  Doorcard   │ │ Appointment │   │   │ Department  │                │ │
│  │  │             │ │             │   │   │             │                │ │
│  │  │ • id        │ │ • id        │   │   │ • id        │                │ │
│  │  │ • userId    │ │ • doorcardId│───┘   │ • name      │                │ │
│  │  │ • name      │ │ • dayOfWeek │       │ • code      │                │ │
│  │  │ • college   │ │ • startTime │       │ • college   │                │ │
│  │  │ • term      │ │ • endTime   │       │             │                │ │
│  │  │ • year      │ │ • location  │       │             │                │ │
│  │  │ • isActive  │ │ • category  │       │             │                │ │
│  │  └─────────────┘ └─────────────┘       └─────────────┘                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Application Flow

### 1. User Authentication Flow

```
User → Google OAuth → NextAuth.js → Prisma Adapter → Database
  ↓
Session Created → Role Assignment → Route Protection
  ↓
Dashboard Access (if authenticated) | Public Access (if not)
```

### 2. Doorcard Creation Flow

```
Dashboard → "New Doorcard" → Campus/Term Selection
    ↓
Basic Info Form → Schedule Form → Preview → Publish
    ↓
Server Actions → Prisma ORM → Database → Redirect
    ↓
Public Visibility (searchable on homepage)
```

### 3. Search & Discovery Flow

```
Homepage → Search Input → API Route (/api/doorcards/public)
    ↓
Prisma Query → Filtered Results → Client-side Filtering
    ↓
Professor Grid → Individual Doorcard View
```

## Technology Stack

### Frontend Framework

- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** with Radix UI components

### Backend & API

- **Next.js API Routes** (Server Actions + Route Handlers)
- **Server-side rendering** and **Static generation**
- **Middleware** for authentication and routing

### Database & ORM

- **Prisma ORM** with PostgreSQL
- **Type-safe** database queries
- **Migration system** for schema changes
- **Connection pooling** for performance

### Authentication

- **NextAuth.js v4** with Google OAuth
- **JWT tokens** for session management
- **Role-based access control** (User/Admin)
- **Prisma adapter** for session storage

### Styling & UI

- **Tailwind CSS** with custom design system
- **Radix UI** components for accessibility
- **Dark/Light mode** toggle (currently forced to light)
- **Responsive design** for mobile/desktop

### Development & Deployment

- **Vercel** for hosting and deployments
- **GitHub Actions** for CI/CD pipeline
- **ESLint** and **Prettier** for code quality
- **Husky** for pre-commit hooks

### Testing & Quality

- **Vitest** (migrating from Jest) for unit testing
- **Cypress** for E2E testing
- **Storybook** for component documentation
- **TypeScript** for compile-time error checking

## Security Features

### Data Protection

- **Environment variables** for sensitive data
- **CSRF protection** via NextAuth
- **SQL injection prevention** via Prisma
- **XSS protection** via React's built-in sanitization

### Authentication Security

- **OAuth 2.0** with Google
- **Secure session management**
- **Role-based route protection**
- **API route authentication**

### Headers & Policies

```typescript
// vercel.json security headers
"X-Frame-Options": "DENY"
"X-Content-Type-Options": "nosniff"
"Referrer-Policy": "strict-origin-when-cross-origin"
```

## Performance Optimizations

### Client-side

- **React 19** with concurrent features
- **useMemo** for expensive computations
- **Debounced search** to reduce API calls
- **Lazy loading** for components

### Server-side

- **Server Components** for reduced bundle size
- **Static generation** for public pages
- **Database query optimization**
- **Connection pooling**

### Deployment

- **Vercel Edge Network** for global CDN
- **Automatic image optimization**
- **Bundle analysis** and optimization
- **Gzip compression**

## Data Models

### Core Entities

1. **User** - Authentication and profile data
2. **Doorcard** - Professor's office hour information
3. **Appointment** - Individual time blocks within a doorcard
4. **Department** - Academic department information

### Relationships

- User **1:many** Doorcard
- Doorcard **1:many** Appointment
- Department **1:many** User (implicit via college field)

This architecture provides a scalable, maintainable, and secure foundation for
the doorcard management system.
