# Scripts

Utility scripts for setup, deployment, and maintenance tasks.

## Structure

```
scripts/
├── setup/
│   ├── init.sh              # Initial project setup
│   ├── install-deps.sh      # Install all dependencies
│   └── configure-env.sh     # Configure environment variables
├── deploy/
│   ├── deploy-staging.sh    # Deploy to staging
│   ├── deploy-production.sh # Deploy to production
│   ├── rollback.sh          # Rollback deployment
│   └── smoke-tests.sh       # Post-deployment validation
├── maintenance/
│   ├── backup-database.sh   # Backup production database
│   ├── cleanup.sh           # Clean up temporary files
│   ├── health-check.sh      # System health check
│   └── performance-check.sh # Performance diagnostics
└── README.md
```

## Setup Scripts

### init.sh
Complete project initialization.

```bash
./scripts/setup/init.sh
```

Steps:
1. Copy .env.example to .env.local
2. Install npm dependencies
3. Setup database
4. Run migrations
5. Seed initial data

### install-deps.sh
Install all project dependencies.

```bash
./scripts/setup/install-deps.sh
```

Installs:
- Root dependencies
- Frontend dependencies
- Backend dependencies
- Test dependencies

### configure-env.sh
Interactive environment configuration.

```bash
./scripts/setup/configure-env.sh
```

Prompts for:
- Supabase URL
- Supabase keys
- Database connection
- Email provider
- API keys

## Deployment Scripts

### deploy-staging.sh
Deploy to staging environment.

```bash
./scripts/deploy/deploy-staging.sh [version]
```

Steps:
1. Run tests
2. Build application
3. Deploy to staging
4. Run smoke tests
5. Notify team

### deploy-production.sh
Deploy to production (requires approval).

```bash
./scripts/deploy/deploy-production.sh [version]
```

Steps:
1. Verify tests pass
2. Build optimized bundle
3. Create backup
4. Deploy blue-green
5. Run smoke tests
6. Monitor for errors

### rollback.sh
Rollback to previous version.

```bash
./scripts/deploy/rollback.sh [version]
```

### smoke-tests.sh
Post-deployment verification.

```bash
./scripts/deploy/smoke-tests.sh
```

Tests:
- API health endpoints
- Database connectivity
- Authentication flow
- Key features work

## Maintenance Scripts

### backup-database.sh
Backup production database.

```bash
./scripts/maintenance/backup-database.sh
```

Creates:
- Timestamped backup file
- Compressed backup
- Stores backup location

### cleanup.sh
Clean up temporary files.

```bash
./scripts/maintenance/cleanup.sh
```

Removes:
- Build artifacts
- Cache files
- Temporary logs
- Old backups

### health-check.sh
Check system health.

```bash
./scripts/maintenance/health-check.sh
```

Checks:
- Database connectivity
- API responsiveness
- Disk space
- Memory usage
- Log file sizes

### performance-check.sh
Performance diagnostics.

```bash
./scripts/maintenance/performance-check.sh
```

Analyzes:
- API response times
- Database query performance
- Memory usage
- CPU usage
- Connection pool status

## Common Tasks

### Setup Development Environment

```bash
./scripts/setup/init.sh
npm run dev
```

### Deploy to Staging

```bash
./scripts/deploy/deploy-staging.sh v1.0.1
```

### Check System Health

```bash
./scripts/maintenance/health-check.sh
```

### Backup Database

```bash
./scripts/maintenance/backup-database.sh
```

### Run Full Test Suite

```bash
npm run test
npm run test:integration
npm run test:e2e
```

## Script Development

### Creating New Scripts

1. Use bash with shebang: `#!/bin/bash`
2. Set error handling: `set -euo pipefail`
3. Add usage information
4. Log important steps
5. Handle errors gracefully
6. Test thoroughly

Template:

```bash
#!/bin/bash
set -euo pipefail

# Script: Description
# Usage: ./scripts/path/script.sh [args]

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Main
main() {
  log "Starting script..."
  # Your code here
  log "Done!"
}

main "$@"
```

## Environment

Scripts use environment variables from `.env`:

```bash
# Load environment
source "${PROJECT_ROOT}/.env"

# Use variables
echo "${SUPABASE_URL}"
echo "${DATABASE_URL}"
```

## Error Handling

Scripts include error handling:

```bash
set -euo pipefail  # Exit on error

trap cleanup EXIT  # Cleanup on exit

cleanup() {
  # Cleanup temporary files
  rm -rf "${TEMP_DIR}"
}
```

## Running Scripts Locally

### Prerequisites

- Bash 4+
- Standard Unix tools (curl, psql, etc.)
- Environment variables configured

### Example: Local Deploy

```bash
# Build
npm run build

# Run tests
npm run test

# Deploy staging
./scripts/deploy/deploy-staging.sh

# Verify
./scripts/deploy/smoke-tests.sh
```

## Scheduled Tasks

### Cron Jobs

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/maintenance/backup-database.sh

# Hourly health check
0 * * * * /path/to/scripts/maintenance/health-check.sh

# Weekly cleanup (Sunday at 3 AM)
0 3 * * 0 /path/to/scripts/maintenance/cleanup.sh
```

## Documentation

Each script includes:
- Purpose and usage
- Arguments and options
- Example commands
- Error conditions
- Logs and outputs

Run with `--help` for details:

```bash
./scripts/deploy/deploy-production.sh --help
```

## Troubleshooting

### Permission Denied
```bash
chmod +x scripts/path/script.sh
```

### Command Not Found
```bash
# Use full path
/path/to/scripts/script.sh
```

### Environment Not Set
```bash
# Source .env
source .env
```

## Contributing Scripts

When adding scripts:
1. Follow naming conventions
2. Include error handling
3. Add logging
4. Document usage
5. Test with different inputs
6. Handle edge cases

## CI/CD Integration

Scripts run in CI/CD pipelines:
- `.github/workflows/test.yml` - Runs tests
- `.github/workflows/deploy.yml` - Runs deployment
- `.github/workflows/maintenance.yml` - Runs maintenance

See `.github/workflows/` for details.
