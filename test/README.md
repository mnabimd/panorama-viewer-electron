# E2E Testing Guide

This directory contains End-to-End (E2E) tests for the Panorama Viewer application.

## Test Files

- **`e2e.spec.ts`** - Basic E2E test (original template)
- **`project-crud.spec.ts`** - Tests for creating and renaming projects

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm test -- --watch
```

### Run a specific test file
```bash
npm test project-crud.spec.ts
```

### Run tests with UI (headed mode - to see the Electron window)
To see what the tests are doing, you can modify the test file to add `headless: false`:

```typescript
electronApp = await electron.launch({
  args: ['.', '--no-sandbox'],
  cwd: root,
  env: { ...process.env, NODE_ENV: 'development' },
  // Add this line to see the app window:
  // executablePath: electron, // Uncomment if needed
})
```

## Test Output

- **Screenshots**: Test screenshots are saved to `test/screenshots/`
- **Console logs**: Check your terminal for detailed test output

## Writing New Tests

1. Create a new `.spec.ts` file in the `test/` directory
2. Follow the pattern from existing test files
3. Use descriptive test names that explain what you're testing
4. Add screenshots at key points for debugging

## Test Structure

Each test file follows this structure:

```typescript
import { beforeAll, afterAll, describe, test, expect } from 'vitest'

beforeAll(async () => {
  // Launch Electron app
})

afterAll(async () => {
  // Cleanup and take screenshots
})

describe('Feature Name', () => {
  test('should do something specific', async () => {
    // Test code here
  })
})
```

## Troubleshooting

### Tests timeout
- Increase the timeout in test configuration: `test('name', async () => { ... }, 60000)`
- Default timeout is 29 seconds (set in `vitest.config.ts`)

### App doesn't start
- Make sure you've built the app first: `npm run build`
- Or the test will use the `pretest` script to build automatically

### Selectors don't work
- Use Playwright's inspector: `PWDEBUG=1 npm test`
- Take screenshots to see the actual state of the app
- Use `page.locator('selector').screenshot()` to debug specific elements

## CI/CD Integration

To run tests in CI (like GitHub Actions):

```yaml
- name: Run E2E Tests
  run: npm test
  
- name: Upload Screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-screenshots
    path: test/screenshots/
```

## Best Practices

1. **Keep tests independent** - Each test should work on its own
2. **Use meaningful selectors** - Prefer data-testid or class names over text
3. **Wait for elements** - Always use `waitForSelector` before interacting
4. **Clean up** - Delete test data after tests complete (if applicable)
5. **Screenshot critical steps** - Helps with debugging when tests fail
