# End-to-End Tests

E2E tests using Playwright that test the application in real browsers.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test test/e2e/app.spec.ts
```

## Features

- **Auto-starts dev server** - Playwright automatically starts Vite dev server
- **Multi-browser** - Tests run in Chromium, Firefox, and WebKit
- **Visual debugging** - Use UI mode to step through tests
- **Screenshots/videos** - Captured on test failures

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Hello')).toBeVisible();
});
```

## Testing Conflict Modal

To test the conflict resolution modal, you'll need to:
1. Mock the API responses in your tests
2. Simulate a 409 conflict response
3. Verify the modal appears and allows resolution

Example:
```typescript
await page.route('**/api/projects/*/patch', async route => {
  await route.fulfill({
    status: 409,
    contentType: 'application/json',
    body: JSON.stringify({
      currentVersion: { /* ... */ }
    })
  });
});
```
