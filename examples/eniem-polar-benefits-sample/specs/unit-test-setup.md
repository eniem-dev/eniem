# Unit Test Setup

## Overview

Set up Vitest as the unit testing framework with full stack testing capabilities - utils/logic, React components, and server actions/API routes. Includes Prisma mocking, React Testing Library, and coverage reporting.

## Job to Be Done

Enable developers to write and run unit tests for the codebase. Ensure code quality and prevent regressions through automated testing.

## Target User

- Developers working on the eniem codebase
- CI/CD pipelines running automated tests

## Requirements

### Must Have

- [ ] Install Vitest and configure for Next.js
- [ ] Install React Testing Library (@testing-library/react, @testing-library/jest-dom)
- [ ] Install vitest-mock-extended for Prisma mocking
- [ ] Configure test environment (jsdom for components, node for server code)
- [ ] Set up path aliases matching tsconfig (@/ imports)
- [ ] Create Prisma mock singleton for test isolation
- [ ] Set up coverage reporting (no threshold)
- [ ] Add `pnpm test` script (single run)
- [ ] Add `pnpm test:watch` script (watch mode)
- [ ] Add `pnpm test:coverage` script
- [ ] Write tests for existing utility functions
- [ ] Write tests for existing React components
- [ ] Write tests for existing server actions

### Nice to Have

- [ ] Test setup file with common mocks (next/navigation, etc.)
- [ ] MSW for API mocking if needed
- [ ] Snapshot testing for components

## Constraints

- Colocated tests: `*.test.ts` / `*.test.tsx` next to source files
- Prisma mocking only (no test database for now)
- Coverage reports without threshold (can add later)
- Must work with Next.js 15 App Router

## Acceptance Criteria

- [ ] `pnpm test` runs all tests and exits with status
- [ ] `pnpm test:watch` runs in watch mode for development
- [ ] `pnpm test:coverage` generates coverage report
- [ ] Tests can import from `@/` path alias
- [ ] React component tests render without errors
- [ ] Server action tests work with mocked Prisma
- [ ] Existing utility functions have test coverage
- [ ] Existing components have test coverage
- [ ] Existing server actions have test coverage

## Edge Cases

- Async server actions: Properly await and assert
- Components with auth: Mock session/user context
- Components with navigation: Mock next/navigation
- Environment variables: Mock env config in tests

## Out of Scope

- Test database setup (future enhancement)
- E2E testing (Playwright/Cypress)
- GitHub Actions CI workflow
- Coverage thresholds
- Visual regression testing
