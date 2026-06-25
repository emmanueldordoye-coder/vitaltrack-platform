# Backend

Backend services, utilities, and Next.js API routes for VitalTrack.

## Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/       # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── inventory.ts
│   │   │   ├── orders.ts
│   │   │   ├── facilities.ts
│   │   │   ├── users.ts
│   │   │   └── reports.ts
│   │   ├── middleware/   # Express/API middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── requestLogger.ts
│   │   └── validators/   # Request validation
│   │       ├── inventory.ts
│   │       ├── orders.ts
│   │       └── users.ts
│   ├── services/        # Business logic
│   │   ├── auth/
│   │   │   ├── AuthService.ts
│   │   │   ├── JwtService.ts
│   │   │   └── PasswordService.ts
│   │   ├── inventory/
│   │   │   ├── InventoryService.ts
│   │   │   ├── StockLevelService.ts
│   │   │   └── ReorderService.ts
│   │   ├── order/
│   │   │   ├── OrderService.ts
│   │   │   └── PurchaseOrderService.ts
│   │   ├── user/
│   │   │   ├── UserService.ts
│   │   │   └── PermissionService.ts
│   │   ├── notification/
│   │   │   ├── NotificationService.ts
│   │   │   └── EmailService.ts
│   │   └── report/
│   │       ├── ReportService.ts
│   │       └── AnalyticsService.ts
│   ├── models/          # Data models
│   │   ├── Inventory.ts
│   │   ├── Order.ts
│   │   ├── User.ts
│   │   ├── Facility.ts
│   │   └── StockLevel.ts
│   ├── utils/           # Utility functions
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── config/          # Configuration
│   │   ├── constants.ts
│   │   ├── env.ts
│   │   └── database.ts
│   └── types/           # TypeScript types
│       └── index.ts
├── tests/               # Backend tests (also in /tests directory)
├── .eslintrc.json
├── tsconfig.json
├── package.json
└── README.md
```

## Key Technologies

- **Node.js 18+** - Runtime
- **TypeScript** - Type safety
- **Express** - Web framework (if needed alongside Next.js)
- **Zod** - Schema validation
- **Winston** - Logging
- **Jest** - Testing

## Services

### AuthService
- User authentication
- Token management
- Password hashing

### InventoryService
- Inventory CRUD operations
- Stock level calculations
- Item tracking

### OrderService
- Purchase order creation and management
- Reorder automation
- Supplier integration

### UserService
- User management
- Permission handling
- Role assignment

### NotificationService
- Email notifications
- Alert dispatching
- Webhook handling

### ReportService
- Report generation
- Analytics computation
- Data aggregation

## API Standards

### Request/Response Format

```typescript
// Request
{
  "facilityId": "string",
  "itemId": "string",
  "quantity": number
}

// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-06-25T14:50:48Z",
    "version": "v1"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Error Codes

- `AUTH_FAILED` - Authentication failed
- `UNAUTHORIZED` - User not authorized
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `CONFLICT` - Resource conflict
- `SERVER_ERROR` - Internal server error

## Authentication

- JWT-based authentication
- Supabase Auth integration
- Role-based access control (RBAC)
- Token refresh mechanism

## Database Access

Uses Supabase client for database operations.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from('inventory')
  .select('*')
  .eq('facility_id', facilityId);
```

## Logging

Structured logging with Winston:

```typescript
logger.info('Inventory updated', {
  inventoryId: 'inv-123',
  quantity: 100,
  userId: 'user-456'
});
```

## Error Handling

Centralized error handling:

```typescript
try {
  // operation
} catch (error) {
  handleError(error, {
    context: 'UpdateInventory',
    userId: req.user.id
  });
}
```

## Development

```bash
npm run dev              # Development server
npm run build            # Build
npm run start            # Production server
npm run test             # Tests
npm run lint             # Linting
```

## Deployment

See main README for deployment instructions.
