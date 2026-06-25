# Supabase Configuration

Supabase backend configuration, migrations, and edge functions for VitalTrack.

## Structure

```
supabase/
├── migrations/
│   ├── 20260625000001_init.sql
│   ├── 20260625000002_auth_policies.sql
│   └── README.md
├── functions/
│   ├── auth/
│   │   ├── handle-signup.ts
│   │   └── send-welcome-email.ts
│   ├── inventory/
│   │   ├── process-reorder.ts
│   │   └── generate-report.ts
│   ├── webhooks/
│   │   └── stripe-webhook.ts
│   └── README.md
├── seed.sql              # Seed data
├── config.toml           # Supabase configuration
├── .env.example          # Environment variables
└── README.md
```

## Setup

### Prerequisites

- Supabase CLI
- Node.js 18+
- PostgreSQL client tools

### Installation

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Link to remote project (after creating on supabase.com)
supabase link --project-ref your-project-ref
```

## Migrations

Database migrations are managed through Supabase.

### Create Migration

```bash
supabase migration new add_new_table
```

This creates a new migration file in `supabase/migrations/`.

### Apply Migrations

```bash
# Apply pending migrations locally
supabase migration up

# Apply to remote project
supabase db push
```

### Migration Format

```sql
-- Create index for performance
create index idx_inventory_facility_item 
on inventory_items(facility_id, item_id);

-- Add column with default
alter table inventory_items 
add column created_at timestamp default now();

-- Update existing data
update inventory_items 
set category = 'general' 
where category is null;

-- Drop old column
alter table inventory_items 
drop column deprecated_field;
```

### Rollback

```bash
# Rollback last migration locally
supabase migration down

# View migration history
supabase migration list
```

## Row-Level Security (RLS)

Protect data with PostgreSQL RLS policies.

### Enable RLS

```sql
alter table inventory_items enable row level security;
```

### Create Policies

```sql
-- Users can only see their organization's data
create policy "Users can view own org data"
on inventory_items for select
using (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Only admins can delete
create policy "Only admins can delete"
on inventory_items for delete
using (
  (select is_admin from users where id = auth.uid())
);
```

### Policy Types

- **SELECT** - Read access
- **INSERT** - Create access
- **UPDATE** - Modify access
- **DELETE** - Delete access

## Edge Functions

Serverless functions for custom logic.

### Create Function

```bash
supabase functions new process-reorder
```

### Function Example

```typescript
// supabase/functions/process-reorder/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const { orderId } = await req.json()

    // Process reorder logic
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'processed' })
      .eq('id', orderId)

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Deploy Functions

```bash
# Deploy single function
supabase functions deploy process-reorder

# Deploy all functions
supabase functions deploy
```

### Call Function

```typescript
// From frontend
const { data, error } = await supabase.functions.invoke('process-reorder', {
  body: { orderId: '123' },
})
```

## Authentication

### Supabase Auth Setup

```typescript
// Create auth client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

// Sign out
await supabase.auth.signOut()
```

### Custom Claims

Add custom claims for RBAC:

```sql
-- Add role claim
update auth.users 
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'::jsonb
)
where id = 'user-id'
```

## Webhooks

Trigger functions on database changes.

### Create Webhook

```sql
create or replace function notify_changes()
returns trigger as $$
begin
  perform pg_notify('db_changes', json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', new
  )::text);
  return new;
end;
$$ language plpgsql;

create trigger notify_inventory_changes
after insert or update or delete on inventory_items
for each row execute function notify_changes();
```

## Realtime

Enable real-time updates for clients.

### Subscribe to Changes

```typescript
const subscription = supabase
  .from('inventory_items')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Unsubscribe
subscription.unsubscribe()
```

## Storage

Supabase storage for files and assets.

### Create Bucket

```bash
supabase storage create-bucket images --public
```

### Upload File

```typescript
const { data, error } = await supabase
  .storage
  .from('images')
  .upload('inventory/item-123.jpg', file)
```

### Download File

```typescript
const { data, error } = await supabase
  .storage
  .from('images')
  .download('inventory/item-123.jpg')
```

## Development

### Local Development

```bash
# Start Supabase locally
supabase start

# This starts:
# - PostgreSQL database
# - Supabase Studio (local UI)
# - Auth service
# - Storage service

# Access Studio at http://localhost:54323
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Update with local credentials
export SUPABASE_URL=http://localhost:54321
export SUPABASE_ANON_KEY=your-anon-key
```

### Reset Local Database

```bash
supabase db reset
```

This drops all data and reapplies migrations.

## Production

### Backup

Supabase handles automatic backups. Manual backup:

```bash
supabase db dump -f backup.sql
```

### Restore

```bash
supabase db restore backup.sql
```

### Monitor

Supabase dashboard provides:
- Query performance metrics
- Disk usage tracking
- Connection monitoring
- Error logs

## Configuration

### config.toml

```toml
[project]
name = "vitaltrack"
database_url = "postgresql://..."

[auth]
enable_signup = true
enable_password_reset = true

[functions]
memory_size = 1024
timeout_sec = 60
```

## Useful Commands

```bash
# View logs
supabase functions logs process-reorder

# Test function locally
supabase functions serve

# View database status
supabase db show

# Export data
supabase db dump -f export.sql --data-only

# Link to project
supabase link --project-ref abc123def456

# Pull remote schema
supabase db pull

# Push local migrations
supabase db push
```

## Best Practices

1. **RLS First** - Always enable RLS on sensitive tables
2. **Migrations** - Use migrations for schema changes
3. **Functions** - Keep edge functions focused and simple
4. **Testing** - Test policies thoroughly
5. **Monitoring** - Monitor query performance
6. **Backups** - Regular backup testing
7. **Documentation** - Document all policies and functions

## Troubleshooting

### Connection Issues
```bash
# Check connection
supabase status

# Restart services
supabase stop
supabase start
```

### Migration Issues
```bash
# View migration status
supabase migration list

# Manual migration
supabase migration up --version 20260625000001
```

### Function Issues
```bash
# View logs
supabase functions logs function-name

# Test locally
supabase functions serve
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Deno Docs](https://deno.land/manual) (for Edge Functions)

## Support

- **Supabase Status**: https://status.supabase.com
- **Community**: https://discord.supabase.io
- **Issues**: https://github.com/supabase/supabase/issues
