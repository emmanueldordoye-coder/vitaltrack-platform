# Tests

Comprehensive test suite for VitalTrack including unit, integration, and end-to-end tests.

## Structure

```
tests/
├── unit/                 # Unit tests
│   ├── services/
│   │   ├── auth.test.ts
│   │   ├── inventory.test.ts
│   │   ├── order.test.ts
│   │   └── user.test.ts
│   ├── utils/
│   │   ├── validators.test.ts
│   │   └── helpers.test.ts
│   └── components/
│       ├── InventoryCard.test.tsx
│       ├── Dashboard.test.tsx
│       └── Forms.test.tsx
├── integration/          # Integration tests
│   ├── api/
│   │   ├── inventory.api.test.ts
│   │   ├── orders.api.test.ts
│   │   ├── auth.api.test.ts
│   │   └── users.api.test.ts
│   ├── database/
│   │   ├── inventory.db.test.ts
│   │   ├── stock_levels.db.test.ts
│   │   └── audit_logs.db.test.ts
│   └── workflows/
│       ├── reordering_workflow.test.ts
│       └── transfer_workflow.test.ts
├── e2e/                 # End-to-end tests (Playwright)
│   ├── auth.e2e.ts
│   ├── inventory.e2e.ts
│   ├── orders.e2e.ts
│   ├── reports.e2e.ts
│   └── user_workflows.e2e.ts
├── fixtures/            # Test data
│   ├── users.ts
│   ├── inventory.ts
│   ├── orders.ts
│   └── facilities.ts
├── mocks/               # Mock implementations
│   ├── supabase.ts
│   ├── api.ts
│   └── services.ts
├── jest.config.js       # Jest configuration
├── playwright.config.ts # Playwright configuration
└── README.md
```

## Test Categories

### Unit Tests

Test individual functions and components in isolation.

**Files**: `tests/unit/**/*.test.ts(x)`

**Framework**: Jest

```typescript
// ✅ Good unit test
describe('calculateReorderPoint', () => {
  it('should calculate correct reorder point', () => {
    const result = calculateReorderPoint(7, 10, 1.5);
    expect(result).toBe(105); // (7 * 10) * 1.5
  });

  it('should use default safety stock multiplier', () => {
    const result = calculateReorderPoint(7, 10);
    expect(result).toBe(105);
  });

  it('should handle zero values', () => {
    const result = calculateReorderPoint(0, 10);
    expect(result).toBe(0);
  });
});
```

### Integration Tests

Test multiple components working together.

**Files**: `tests/integration/**/*.test.ts`

**Framework**: Jest + Test Database

```typescript
// ✅ Good integration test
describe('InventoryService', () => {
  let service: InventoryService;
  let db: Database;

  beforeAll(async () => {
    db = await setupTestDatabase();
    service = new InventoryService(db);
  });

  afterEach(async () => {
    await db.reset();
  });

  it('should adjust stock and create audit log', async () => {
    const itemId = 'item-123';
    await service.adjustStock(itemId, 100);

    const logs = await db.query(
      'SELECT * FROM audit_logs WHERE resource_id = $1',
      [itemId]
    );

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('STOCK_ADJUSTED');
  });
});
```

### End-to-End Tests

Test complete user workflows through the application.

**Files**: `tests/e2e/**/*.e2e.ts`

**Framework**: Playwright

```typescript
// ✅ Good E2E test
test('User can create and track inventory order', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Navigate to orders
  await page.goto('/dashboard/orders');
  await page.click('[data-testid="create-order-button"]');

  // Fill order form
  await page.fill('[data-testid="supplier"]', 'Supplier Co');
  await page.fill('[data-testid="item"]', 'Saline Bags');
  await page.fill('[data-testid="quantity"]', '100');
  await page.click('[data-testid="submit-order"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  await expect(page).toHaveURL('/dashboard/orders/detail/*');
});
```

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:ui    # With UI
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Database Setup

Integration and E2E tests use a separate test database:

```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js';

export async function setupTestDatabase() {
  const supabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_KEY!
  );

  // Run migrations
  // Seed test data
  
  return supabase;
}
```

## Fixtures

Pre-built test data for consistent testing:

```typescript
// tests/fixtures/inventory.ts
export const testInventoryItem = {
  id: 'inv-123',
  sku: 'SKU-001',
  name: 'Saline Bags',
  quantity: 100,
};

export const testFacility = {
  id: 'fac-123',
  name: 'Main Hospital',
  organizationId: 'org-123',
};
```

## Mocking

Mock external dependencies:

```typescript
// tests/mocks/supabase.ts
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [] }),
      }),
    }),
  }),
}));
```

## Coverage Targets

- **Overall**: >80%
- **Critical paths**: >95%
- **Utils**: >85%
- **Components**: >75%

Current coverage: See `coverage/` after running tests.

## Performance Testing

Load and performance tests:

```bash
npm run test:performance
```

Tests measure:
- API response times
- Database query performance
- Frontend render performance
- Memory usage

## Debugging Tests

### Debug Single Test
```bash
NODE_DEBUG_OPTION=--inspect-brk npm run test -- --testNamePattern="test name"
```

### Debug E2E Test
```bash
npm run test:e2e:debug
```

### View Test Report
```bash
npm run test:e2e -- --reporter=html
```

## CI/CD Integration

Tests run automatically:
- On every commit (pre-commit hook)
- On every pull request
- Before deployment
- Nightly full test run

See `.github/workflows/` for CI configuration.

## Test Best Practices

1. **Write descriptive test names**: Describe what you're testing
2. **One assertion per test**: Keep tests focused
3. **Use fixtures**: Consistent test data
4. **Mock external services**: Isolate tests
5. **Clean up**: Reset state between tests
6. **Test edge cases**: Empty, null, invalid input
7. **Test error paths**: What happens when things fail
8. **Keep tests fast**: Parallel execution
9. **Document complex logic**: Comments for non-obvious tests
10. **Review tests in PR**: Tests are code too

## Troubleshooting

### Tests Timing Out
- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Check database connection

### Flaky Tests
- Use proper test isolation
- Avoid hardcoded delays
- Check for race conditions

### Memory Issues
- Clear cache between tests
- Close database connections
- Reduce test data size

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
