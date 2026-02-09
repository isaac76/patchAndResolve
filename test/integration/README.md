# Integration Tests

This directory contains integration tests for the patch-and-resolve library using the example application.

## Running Integration Tests

```bash
# From the root of the project
npm run test

# Run integration tests specifically
npm run test test/integration
```

## Structure

- `examples/basic-usage/` - Example app that imports the library
- Tests in this directory verify the library works correctly when imported

## Future Additions

- End-to-end tests using Playwright or Cypress
- Mock backend server for testing conflict scenarios
- Automated browser testing
