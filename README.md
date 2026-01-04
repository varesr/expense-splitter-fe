# Expense Splitter - Frontend

A modern web application for tracking and splitting expenses, built with Next.js 15, React 18, TypeScript, and TanStack Query.

## Table of Contents

- [Features](#features)
- [Design Theme](#design-theme)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Docker](#docker)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Contributing Guidelines](#contributing-guidelines)

## Features

- **Transaction Management**: View and filter transactions by year and month
- **Type-Safe**: Full TypeScript support with strict mode enabled
- **Modern UI**: Built with Tailwind CSS, responsive design with dark mode support
- **Custom Theme**: Light backgrounds with dark green components for a professional appearance
- **Form Handling**: React Hook Form for performant form validation
- **State Management**: TanStack Query for server state management
- **Testing**: Comprehensive testing setup with Vitest and Cypress

## Design Theme

The application features a cohesive color theme with:
- **Light backgrounds** (#fafaf9) for a clean, airy feel
- **Dark green components** (#16a34a) for buttons and primary actions
- **Stone text colors** for warm, readable typography
- **WCAG AA compliant** contrast ratios for accessibility
- **Consistent styling** across all pages and components

See [THEME_IMPLEMENTATION.md](./THEME_IMPLEMENTATION.md) for detailed theme documentation.

## Technology Stack

### Core Technologies

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5.6+](https://www.typescriptlang.org/) (strict mode)
- **UI Library**: [React 18.3+](https://react.dev/)
- **Styling**: [Tailwind CSS 3.4+](https://tailwindcss.com/)
- **Package Manager**: npm

### Data & Forms

- **Data Fetching**: [TanStack Query 5.59+](https://tanstack.com/query/latest) (React Query)
- **Form Handling**: [React Hook Form 7.53+](https://react-hook-form.com/)

### Testing & Quality

- **Unit/Integration**: [Vitest 2.1+](https://vitest.dev/) + [React Testing Library 16+](https://testing-library.com/react)
- **E2E Testing**: [Cypress 13.15+](https://www.cypress.io/)
- **Linting**: [ESLint 8+](https://eslint.org/) with TypeScript plugins
- **Formatting**: [Prettier 3.3+](https://prettier.io/)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))

Check your versions:

```bash
node --version  # Should be v18.0.0+
npm --version   # Should be v9.0.0+
```

## Getting Started

### Installation

1. **Clone the repository** (if not already cloned):

   ```bash
   git clone <repository-url>
   cd expense-splitter/frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   This will install all dependencies listed in `package.json`.

### Running the Application

#### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://192.168.x.x:3000 (accessible from other devices on your network)

#### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The optimized application will run on http://localhost:3000

## Docker

The application can be run in a Docker container for consistent deployment across environments.

### Prerequisites

- **Docker**: v20.10.0 or higher ([Download](https://www.docker.com/get-started))
- **Docker Compose**: v2.0.0 or higher (included with Docker Desktop)

### Quick Start

Build and run the container:

```bash
docker compose build
docker compose up -d
```

The application will be available at http://localhost:7273

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker compose build` | Build the Docker image |
| `docker compose up -d` | Start the container in detached mode |
| `docker compose down` | Stop and remove the container |
| `docker compose logs -f` | View container logs |
| `docker compose restart` | Restart the container |

### Configuration

The Docker setup uses the following configuration:

- **Port**: 7273 (configurable in `docker-compose.yml`)
- **API URL**: Configured via `NEXT_PUBLIC_API_URL` build argument
- **Base Image**: Node.js 20 Alpine (optimized for size)

#### Connecting to Backend API

By default, the container is configured to connect to a backend running on the host machine at port 7272. This uses `host.docker.internal` to resolve the host from within the container.

To change the API URL, modify the `NEXT_PUBLIC_API_URL` argument in `docker-compose.yml`:

```yaml
args:
  NEXT_PUBLIC_API_URL: http://your-api-url:port
```

### Docker Files

| File | Description |
|------|-------------|
| `Dockerfile` | Multi-stage build configuration for production |
| `docker-compose.yml` | Container orchestration configuration |
| `.dockerignore` | Files excluded from Docker build context |
| `.env.docker` | Docker-specific environment variables |

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── transactions/            # Transactions feature
│       └── page.tsx             # Transactions page
│
├── components/                   # React components
│   ├── ui/                      # Generic UI components (buttons, inputs)
│   ├── features/                # Feature-specific components
│   │   └── transaction-filter-form.tsx
│   └── layouts/                 # Layout components
│
├── hooks/                        # Custom React hooks
│   └── (custom hooks here)
│
├── lib/                          # Utility functions and shared logic
│   └── query-provider.tsx       # TanStack Query provider setup
│
├── services/                     # API services and data fetching
│   └── (API service modules)
│
├── types/                        # TypeScript type definitions
│   └── (shared types)
│
├── constants/                    # Application constants
│   └── (constant values)
│
├── config/                       # Configuration files
│   └── (config modules)
│
├── tests/                        # Test files and utilities
│   ├── setup.ts                 # Vitest test setup
│   ├── e2e/                     # Cypress E2E tests
│   │   ├── support/             # Cypress support files
│   │   └── transactions.cy.ts   # Example E2E test
│   └── fixtures/                # Test fixtures and mock data
│
├── public/                       # Static assets
│   └── (images, fonts, etc.)
│
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── vitest.config.ts              # Vitest configuration
├── cypress.config.ts             # Cypress configuration
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
└── README.md                     # This file
```

### Directory Conventions

- **`/app`**: Next.js 15 App Router pages and layouts (file-based routing)
- **`/components/ui`**: Reusable, generic UI components (buttons, inputs, modals)
- **`/components/features`**: Domain-specific components tied to features
- **`/hooks`**: Custom React hooks for reusable logic
- **`/lib`**: Utility functions, helpers, and shared logic
- **`/services`**: API client code and data fetching functions
- **`/types`**: Shared TypeScript interfaces and types

## Development Workflow

### Before Starting Work

```bash
# Ensure dependencies are up to date
npm install

# Run type checking
npm run type-check
```

### During Development

```bash
# Start dev server
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch
```

### Before Committing

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Run type checking
npm run type-check

# Run all tests
npm test
```

## Testing

### Unit and Integration Tests (Vitest)

Run unit and integration tests with Vitest and React Testing Library:

```bash
# Run tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Coverage reports** are generated in the `coverage/` directory.

#### Running Specific Tests

```bash
# Run tests for a specific file
npm test transaction-filter-form

# Run tests matching a pattern
npm test -- --grep="filter"
```

#### Writing Tests

Tests are co-located with source files using the `.test.tsx` or `.test.ts` suffix:

```
components/features/transaction-filter-form.tsx
components/features/transaction-filter-form.test.tsx  ← Test file
```

Example test:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransactionFilterForm } from './transaction-filter-form';

describe('TransactionFilterForm', () => {
  it('renders year and month selectors', () => {
    render(<TransactionFilterForm onSubmit={() => {}} />);
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
  });
});
```

### End-to-End Tests (Cypress)

Run E2E tests with Cypress:

```bash
# Open Cypress Test Runner (interactive)
npm run test:e2e

# Run Cypress tests headlessly (CI mode)
npx cypress run
```

**Note**: The development server must be running (`npm run dev`) for E2E tests to work.

#### E2E Test Location

E2E tests are located in `tests/e2e/` with the `.cy.ts` suffix:

```
tests/e2e/transactions.cy.ts
```

Example E2E test:

```typescript
describe('Transactions Page', () => {
  beforeEach(() => {
    cy.visit('/transactions');
  });

  it('allows user to filter transactions', () => {
    cy.get('#year').select('2024');
    cy.get('#month').select('6');
    cy.contains('button', 'Apply Filter').click();
    cy.contains('Year: 2024').should('be.visible');
  });
});
```

## Code Quality

### Linting

Check code for linting errors:

```bash
npm run lint
```

Fix linting errors automatically:

```bash
npm run lint:fix
```

### Code Formatting

Format all code with Prettier:

```bash
npm run format
```

### Type Checking

Run TypeScript compiler checks without emitting files:

```bash
npm run type-check
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build production-ready application |
| `npm start` | Start production server (requires `build` first) |
| `npm run lint` | Check code for linting errors |
| `npm run lint:fix` | Fix linting errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm test` | Run unit/integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:e2e` | Open Cypress E2E test runner |

## Environment Variables

Environment variables should be added to `.env.local` (not committed to Git):

```env
# Example environment variables
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Server-only variables should NOT use this prefix.

### Creating Environment File

```bash
# Create local environment file
touch .env.local
```

Then add your variables to `.env.local`.

## Contributing Guidelines

### Code Standards

1. **TypeScript**: Always use explicit types, avoid `any`
2. **Components**: Use functional components with named exports
3. **Hooks**: Extract complex logic into custom hooks
4. **Testing**: Write tests for new features and bug fixes
5. **Formatting**: Code must pass Prettier and ESLint checks

### Git Workflow

1. Create a feature branch from `main`
2. Make changes and commit with descriptive messages
3. Run tests and linting before pushing
4. Create a pull request for review

### Commit Message Format

```
type(scope): description

Examples:
feat(transactions): add year/month filter
fix(forms): correct validation error message
test(transactions): add E2E test for filtering
docs(readme): update installation instructions
```

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

**Module not found errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**Test failures:**
```bash
# Clear test cache
npx vitest --clearCache
npm test
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [React Hook Form Docs](https://react-hook-form.com/get-started)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Cypress Documentation](https://docs.cypress.io/)

## License

[Add your license information here]

## Support

For issues and questions, please refer to the project's issue tracker or contact the development team.

---

**Happy Coding!** 🚀
