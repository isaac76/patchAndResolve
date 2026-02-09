# Unit Tests

Unit tests for individual components and services.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

## Structure

- `ConflictResolver.test.ts` - Tests for conflict resolution logic
- `PatchService.test.ts` - Tests for API service

## Guidelines

- Test business logic in isolation
- Mock external dependencies (fetch, etc.)
- Keep tests fast and focused
- Aim for high coverage of services and utilities
