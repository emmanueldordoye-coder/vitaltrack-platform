# Frontend

Next.js-based React frontend application for VitalTrack.

## Structure

```
frontend/
├── public/                 # Static assets (images, icons, fonts)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Homepage
│   │   ├── (auth)/        # Auth routes (login, signup, reset)
│   │   ├── (dashboard)/   # Dashboard routes
│   │   │   ├── inventory/ # Inventory management
│   │   │   ├── orders/    # Order management
│   │   │   ├── reports/   # Reporting
│   │   │   ├── settings/  # Settings
│   │   │   └── layout.tsx # Dashboard layout
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── common/        # Reusable components (Button, Card, Modal, etc.)
│   │   ├── inventory/     # Inventory-specific components
│   │   ├── orders/        # Order-specific components
│   │   ├── reports/       # Report-specific components
│   │   └── layouts/       # Layout components
│   ├── hooks/             # Custom React hooks
│   │   ├── useInventory.ts
│   │   ├── useAuth.ts
│   │   └── useNotification.ts
│   ├── lib/               # Utility functions
│   │   ├── api.ts         # API client
│   │   ├── db.ts          # Supabase client
│   │   ├── auth.ts        # Auth utilities
│   │   └── utils.ts       # Helper functions
│   ├── types/             # TypeScript types
│   │   ├── index.ts
│   │   ├── inventory.ts
│   │   ├── order.ts
│   │   └── user.ts
│   ├── styles/
│   │   ├── globals.css    # Global styles
│   │   └── components/    # Component-specific CSS modules
│   └── middleware.ts      # Next.js middleware
├── .eslintrc.json         # ESLint configuration
├── .prettierrc             # Prettier configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── package.json
└── README.md
```

## Key Technologies

- **Next.js 14+** - React framework with SSR
- **React 18+** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - State management for async data
- **Zustand** - Client state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Jest** - Unit testing
- **Playwright** - E2E testing

## Development

### Setup
```bash
npm install
npm run dev
```

### Building
```bash
npm run build
npm run start
```

### Testing
```bash
npm run test              # Unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run e2e              # E2E tests
```

### Linting
```bash
npm run lint
npm run lint:fix
npm run format
npm run type-check
```

## Standards

### Component Structure

```typescript
// ✅ Good component pattern
import React from 'react';
import { cn } from '@/lib/utils';

export interface InventoryCardProps {
  id: string;
  name: string;
  quantity: number;
  onUpdate?: () => void;
}

export function InventoryCard({
  id,
  name,
  quantity,
  onUpdate,
}: InventoryCardProps) {
  return (
    <div className={cn('p-4 bg-white rounded-lg shadow')}>
      <h3>{name}</h3>
      <p>{quantity} units</p>
    </div>
  );
}

export default InventoryCard;
```

### Hook Pattern

```typescript
// ✅ Good hook pattern
import { useQuery } from '@tanstack/react-query';
import { fetchInventoryItem } from '@/lib/api';

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => fetchInventoryItem(id),
  });
}
```

## Build Output

Production build output goes to `.next/` directory.

Size budget:
- Main bundle: <500KB (gzipped)
- Page bundles: <200KB each
- Images: Optimized with Next.js Image component

## Performance

- Core Web Vitals targets:
  - LCP: <2.5s
  - FID: <100ms
  - CLS: <0.1
- Code splitting enabled
- CSS-in-JS optimized
- Image optimization

## Deployment

Built for Vercel but can be deployed anywhere Node.js is supported.

See main README for deployment instructions.
