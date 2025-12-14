# Quick Start Guide

This is a condensed guide to get you up and running quickly. For detailed information, see [README.md](./README.md).

## Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Visit http://localhost:3000 to see your app running.

## Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm start               # Run production build

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:e2e        # Open Cypress E2E tests

# Code Quality
npm run lint            # Check for linting errors
npm run lint:fix        # Fix linting errors
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
```

## Project Pages

- **Home**: http://localhost:3000
- **Transactions**: http://localhost:3000/transactions

## Key Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 18 + Tailwind CSS
- **Forms**: React Hook Form
- **Data**: TanStack Query
- **Testing**: Vitest + Cypress

## File Structure (Simplified)

```
frontend/
├── app/                    # Pages (file-based routing)
│   ├── page.tsx           # Home page (/)
│   └── transactions/      # /transactions route
├── components/            # React components
│   ├── features/         # Feature components
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities & providers
├── tests/                 # Test files
└── public/               # Static assets
```

## Adding a New Page

1. Create a new folder in `app/` with the route name
2. Add a `page.tsx` file in that folder
3. Export a default React component

Example:

```typescript
// app/settings/page.tsx
export default function SettingsPage() {
  return <h1>Settings</h1>;
}
```

This creates a page at `/settings`.

## Adding a Component

1. Create file in `components/features/` or `components/ui/`
2. Use TypeScript and named exports

Example:

```typescript
// components/ui/button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

## Writing Tests

### Unit Test

```typescript
// component.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test

```typescript
// tests/e2e/feature.cy.ts
describe('Feature', () => {
  it('works correctly', () => {
    cy.visit('/page');
    cy.contains('Button').click();
    cy.contains('Success').should('be.visible');
  });
});
```

## Troubleshooting

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**Module errors?**
```bash
rm -rf node_modules package-lock.json .next
npm install
```

**Need help?** See the full [README.md](./README.md) for detailed documentation.
