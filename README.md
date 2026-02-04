# Next Doorcard - Faculty Digital Doorcard System

A Next.js application for creating and managing digital doorcards for faculty
members at SMCCD.

## Tech Stack

- **Framework**: Next.js 16.0.1 with React 19
- **Bundler**: Turbopack (5-10x faster Fast Refresh)
- **Language**: TypeScript 5
- **Database**: Prisma ORM 6.19.0
- **Authentication**: NextAuth v4 with OneLogin SSO
- **Styling**: Tailwind CSS with Radix UI components
- **Testing**: Vitest, Cypress, Storybook
- **Monitoring**: Sentry 10.x
- **Code Quality**: ESLint, Prettier, Husky

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file with Turbopack's lightning-fast Fast Refresh.

## Environment Setup

See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for detailed
configuration instructions.

Quick start:

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

## Project Structure

```
/app                    # Next.js App Router pages
/components             # Reusable React components
  /ui                   # shadcn/ui components
  /design-system        # Design system components
/lib                    # Utility functions and config
/prisma                 # Database schema and migrations
/scripts                # Build and utility scripts
/docs                   # Project documentation
```

## Available Scripts

### Development

- `npm run dev` - Start development server (safe mode with Turbopack)
- `npm run dev:unsafe` - Start without safety checks
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests with Cypress
- `npm run storybook` - Run Storybook component explorer

### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Quality Assurance

- `npm run qa:urls` - Comprehensive URL quality testing
- `npm run qa:urls:quick` - Quick URL validation
- `npm run security:headers` - Verify security headers (local)
- `npm run security:headers:prod` - Verify security headers (production)

See [CLAUDE.md](CLAUDE.md) for complete command reference.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Documentation

- [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) - Multi-environment
  configuration
- [Next.js 16 Upgrade Guide](docs/UPGRADE_NEXT16.md) - Latest upgrade details
- [Project Instructions](CLAUDE.md) - Development guidelines and commands

## Recent Updates

### Next.js 16.0.1 Upgrade (2025-11-11)

- ✅ Upgraded to Next.js 16.0.1 with Turbopack as default bundler
- ✅ Updated Sentry to v10 with modern sourcemaps
- ✅ Updated Storybook to v10 with enhanced UI
- ✅ All tests passing, build successful in ~6.4s

See [docs/UPGRADE_NEXT16.md](docs/UPGRADE_NEXT16.md) for complete upgrade
details.

## Deploy on Vercel

This application is deployed on Vercel with environment-specific configurations:

- **Production**: https://doorcard.smccd.edu (PROD OneLogin, PROD DB)
- **Preview**: Auto-deployed for each branch (DEV OneLogin, Preview DB)
- **Development**: Local with DEV OneLogin

See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for deployment
configuration.

## Contributing

1. Follow code style guidelines in [CLAUDE.md](CLAUDE.md)
2. Run `npm run lint` and `npm run type-check` before committing
3. Write tests for new features
4. Update documentation as needed
5. Use conventional commit messages

## Support

- **IT Support**: itsupport@smccd.edu
- **Documentation**: See `/docs` directory
- **Issues**: Contact IT Support for bug reports and feature requests
