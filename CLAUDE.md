# Project Instructions

## AI Assistant Guidelines

When working on this project:
1. **Always read existing code** before making changes
2. **Follow existing patterns** - Maintain consistency with codebase
3. **Plan first** - For new features always make a plan first and ask for user's confirmation before executing the plan
4. **Write tests** for new features and bug fixes
5. **Update types** when modifying data structures
5. **Check for existing utilities** before creating new ones
6. **Consider performance** - Don't optimize prematurely, but be aware
7. **Security first** - Always validate inputs and handle errors
8. **Ask for clarification** when requirements are ambiguous
9. **Keep changes focused** - Don't refactor unrelated code
10. **Verify changes work** - Run relevant tests after modifications
11. **Do not change AI assistant Guidelines** - Never change AI assistant guidelines section
12. **Do not change styling/color theme** - Do not change it unless explicitly asked to

## Technology Stack

### Core Technologies
- **Package Manager**: npm
- **Runtime**: Node.js
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode enabled)
- **UI Library**: React 18+
- **Data Fetching**: TanStack Query (React Query) with native Fetch API
- **Forms**: React Hook Form
- **Styling**: CSS Modules / Tailwind CSS (as configured)

### Testing Stack
- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Cypress
- **Coverage**: Maintain minimum 80% coverage for critical business logic

### Code Quality
- **Linting**: ESLint with TypeScript and React plugins
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## Project Structure

```
/app                 # Next.js app router pages and layouts
/components          # Reusable React components
  /ui                # Generic UI components (buttons, inputs, etc.)
  /features          # Feature-specific components
  /layouts           # Layout components
/hooks               # Custom React hooks
/lib                 # Utility functions and shared logic
/services            # API services and data fetching
/types               # TypeScript type definitions
/constants           # Application constants
/config              # Configuration files
/public              # Static assets
/tests               # Test utilities and setup
  /e2e               # Cypress E2E tests
  /fixtures          # Test fixtures and mock data
```

## Coding Standards

### TypeScript Guidelines

1. **Always use explicit types** - Avoid `any`, use `unknown` when type is truly unknown
2. **Leverage type inference** - Don't over-annotate when TypeScript can infer
3. **Use interfaces for objects**, types for unions/intersections
4. **Strict null checking** - Handle null/undefined explicitly
5. **Use const assertions** for literal types

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = fetchUser();

// Bad
const user: any = fetchUser();
```

### React Component Guidelines

1. **Functional components only** - No class components
2. **Use named exports** for components (better for refactoring)
3. **Props interface naming**: `ComponentNameProps`
4. **Keep components small** - Single Responsibility Principle
5. **Extract logic to custom hooks** when it becomes complex

```typescript
// components/features/user-profile.tsx
interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { data, isLoading, error } = useUser(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* component JSX */}</div>;
}
```

### Next.js Conventions

1. **Use App Router** - Leverage React Server Components where appropriate
2. **Client components** - Mark with `"use client"` only when necessary (hooks, interactivity)
3. **Server actions** - Use for form submissions when appropriate
4. **Metadata API** - Use for SEO optimization
5. **Route organization** - Group related routes using route groups `(group-name)`

### Data Fetching with TanStack Query

1. **Query keys** - Use hierarchical array format: `['resource', id, 'subresource']`
2. **Custom hooks** - Wrap queries in custom hooks for reusability
3. **Error handling** - Always handle errors at the component level
4. **Optimistic updates** - Use for better UX on mutations

```typescript
// hooks/use-user.ts
import { useQuery } from '@tanstack/react-query';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Form Handling with React Hook Form

1. **Type-safe forms** - Use TypeScript for form data
2. **Validation** - Use built-in validation or integrate with Zod
3. **Error display** - Show field-level errors clearly
4. **Submit handlers** - Use TanStack Query mutations

```typescript
import { useForm } from 'react-hook-form';

interface FormData {
  name: string;
  email: string;
}

export function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const mutation = useCreateUser();

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: 'Name is required' })} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

## Testing Guidelines

### Unit/Integration Testing (Vitest + React Testing Library)

1. **Test behavior, not implementation** - Focus on user interactions
1. **Test positive and negative scenarios** - And test edge cases
2. **Avoid testing library internals** - Don't test hooks directly
3. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
4. **Mock external dependencies** - API calls, external services
5. **Test files location** - Co-locate with source files: `component.test.tsx`

```typescript
// components/user-profile.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from './user-profile';

describe('UserProfile', () => {
  it('displays user information', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <UserProfile userId="123" />
      </QueryClientProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });
});
```

### E2E Testing (Cypress)

1. **Test all user flows**
2. **Use data-testid** for stable selectors in E2E tests only
3. **Independent tests** - Each test should be able to run in isolation
4. **Seed test data** - Use fixtures or API calls to set up state
5. **Location** - Store in `/tests/e2e/`

```typescript
// tests/e2e/user-flow.cy.ts
describe('User Profile Flow', () => {
  beforeEach(() => {
    cy.visit('/profile');
  });

  it('allows user to update profile', () => {
    cy.findByLabelText('Name').clear().type('New Name');
    cy.findByRole('button', { name: /save/i }).click();
    cy.findByText('Profile updated').should('be.visible');
  });
});
```

## Security Best Practices

### Client-Side Security

1. **Input Validation** - Always validate and sanitize user input
2. **XSS Prevention** - React escapes by default, but be careful with `dangerouslySetInnerHTML`
3. **Sensitive Data** - Never store sensitive data in localStorage/sessionStorage
4. **Dependencies** - Keep dependencies updated, run `npm audit` regularly
5. **Environment Variables** - Use `NEXT_PUBLIC_` prefix only for public variables

```typescript
// Good - Server-side environment variable (not exposed to client)
const API_SECRET = process.env.API_SECRET;

// Good - Public client-side variable
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
```

### API Security

1. **HTTPS Only** - Even in local network, use HTTPS when possible
2. **Rate Limiting** - Implement on API routes
3. **Input Validation** - Validate all inputs on server-side
4. **Error Messages** - Don't expose sensitive info in error messages
5. **CORS** - Configure appropriately for local network access

### Content Security

1. **CSP Headers** - Configure Content Security Policy in next.config.js
2. **Safe External Links** - Use `rel="noopener noreferrer"` for external links
3. **Image Optimization** - Use Next.js Image component with proper domains

## SOLID Principles Application

### Single Responsibility Principle
- Components should do one thing well
- Extract complex logic into custom hooks
- Separate data fetching from presentation

### Open/Closed Principle
- Use composition over prop drilling
- Create extensible component APIs with proper TypeScript generics

### Liskov Substitution Principle
- Ensure component variants are truly interchangeable
- Maintain consistent prop interfaces across similar components

### Interface Segregation Principle
- Keep prop interfaces minimal
- Don't force components to accept unused props

### Dependency Inversion Principle
- Components depend on abstractions (interfaces) not concrete implementations
- Use dependency injection for services (via context or props)

```typescript
// Good - Component depends on interface, not implementation
interface DataFetcher<T> {
  fetch: () => Promise<T>;
}

function DataDisplay<T>({ fetcher }: { fetcher: DataFetcher<T> }) {
  // Component doesn't care about implementation details
}
```

## Performance Considerations

1. **Code Splitting** - Use dynamic imports for large components
2. **Image Optimization** - Always use Next.js Image component
3. **React Query Caching** - Configure appropriate stale times
4. **Memoization** - Use `useMemo` and `useCallback` judiciously (only when needed)
5. **Server Components** - Use for static content to reduce client bundle

## Error Handling

1. **Error Boundaries** - Wrap routes in error boundaries
2. **Query Errors** - Handle with TanStack Query's error handling
3. **Form Errors** - Display clearly at field level
4. **User Feedback** - Always provide feedback for async operations
5. **Logging** - Log errors appropriately (consider error tracking service)

```typescript
// Error boundary component
'use client';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error) => console.error('Error:', error)}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

## Common Patterns

### Custom Hook Pattern
```typescript
// hooks/use-users.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### Service Layer Pattern
```typescript
// services/user-service.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const userService = {
  async getAll() {
    const response = await fetch(`${BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getById(id: string) {
    const response = await fetch(`${BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async create(data: CreateUserData) {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
};
```

## Development Workflow

1. **Before starting work** - Run `npm install` and ensure all dependencies are up to date
2. **Security check** - Run `npm audit` and fix any vulnerabilities with `npm audit fix`
3. **During development** - Run tests in watch mode: `npm run test:watch`
4. **Before committing** - Ensure linting passes: `npm run lint` and ensure all tests (unit, integration and e2e) pass
5. **Code formatting** - Run Prettier: `npm run format`
6. **Type checking** - Run: `npm run type-check`

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run Cypress E2E tests

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Run Prettier
npm run type-check      # Run TypeScript compiler check

# Utilities
npm run clean           # Clean build artifacts
npm audit               # Check for security vulnerabilities
npm audit fix           # Fix vulnerabilities (non-breaking)
npm audit fix --force   # Fix all vulnerabilities (may include breaking changes)
```

## Additional Notes

- **Pragmatic Approach**: Apply best practices where they add value, avoid over-engineering
