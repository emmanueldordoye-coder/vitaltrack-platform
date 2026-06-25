# Contributing to VitalTrack

Thank you for your interest in contributing to VitalTrack Technologies! This document provides guidelines and instructions for contributing to our project.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- **Be Respectful**: Respect diverse perspectives and backgrounds
- **Be Inclusive**: Welcome all contributors regardless of experience level
- **Be Professional**: Maintain professional communication in all interactions
- **Report Issues**: Report unacceptable behavior to conduct@vitaltrack.io

## Getting Started

### Development Environment Setup

1. **Fork the repository**
   ```bash
   # Fork at https://github.com/vitaltrack/vitaltrack-platform/fork
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vitaltrack-platform.git
   cd vitaltrack-platform
   git remote add upstream https://github.com/vitaltrack/vitaltrack-platform.git
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # Branch naming: feature/, bugfix/, docs/, chore/
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Setup pre-commit hooks**
   ```bash
   npm run prepare
   ```

## Development Workflow

### Before You Start

1. Check existing issues and PRs to avoid duplicate work
2. For significant changes, open an issue first to discuss
3. Ensure you understand the project architecture
4. Read the relevant documentation

### Making Changes

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/add-inventory-dashboard
   ```

2. **Write your code** following our standards (see below)

3. **Write tests** for your changes
   ```bash
   npm run test
   ```

4. **Update documentation** as needed

5. **Commit your changes** with meaningful messages
   ```bash
   git commit -m "feat: add inventory dashboard

   - Add dashboard component
   - Integrate with inventory API
   - Add unit tests
   
   Closes #123"
   ```

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (no logic changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/modifications
- `chore`: Build, dependencies, or tooling changes
- `ci`: CI/CD changes

**Example:**
```
feat(inventory): add real-time stock level updates

Implement WebSocket connection for real-time inventory
tracking across multiple facilities.

- Add WebSocket service layer
- Update inventory components
- Add integration tests

Closes #456
```

## Code Standards

### TypeScript

- Use strict mode: `"strict": true` in `tsconfig.json`
- Explicit types for function parameters and return values
- No `any` types unless absolutely necessary (document why)
- Prefer interfaces over types for object shapes

```typescript
// ✅ Good
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  lastUpdated: Date;
}

function updateInventory(item: InventoryItem): Promise<InventoryItem> {
  // implementation
}

// ❌ Avoid
function updateInventory(item: any): any {
  // implementation
}
```

### React & Next.js

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable components to `/components`
- Use proper error boundaries
- Implement loading and error states

```typescript
// ✅ Good
export interface Props {
  inventoryId: string;
}

export function InventoryCard({ inventoryId }: Props) {
  const { data, isLoading, error } = useInventory(inventoryId);

  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard message={error.message} />;
  
  return <div>{/* component content */}</div>;
}

export default InventoryCard;
```

### Styling

- Use Tailwind CSS utility classes
- Use CSS modules for component-specific styles
- Follow mobile-first responsive design
- Maintain consistent spacing and typography

```typescript
// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
</div>

// ✅ Also good - CSS modules for complex styling
import styles from './InventoryCard.module.css';
<div className={styles.container}>
```

### Testing

- Write tests for new features
- Minimum 80% code coverage target
- Use Jest for unit tests
- Use Playwright for E2E tests

```typescript
// ✅ Good test
describe('InventoryCard', () => {
  it('should display loading skeleton while fetching', () => {
    const { getByTestId } = render(
      <InventoryCard inventoryId="123" />
    );
    expect(getByTestId('skeleton-card')).toBeInTheDocument();
  });

  it('should display error message on failure', async () => {
    useInventory.mockImplementation(() => ({
      error: new Error('Failed to fetch'),
    }));
    
    const { getByText } = render(
      <InventoryCard inventoryId="123" />
    );
    expect(getByText(/failed to fetch/i)).toBeInTheDocument();
  });
});
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm run test
   npm run test:coverage
   ```

2. **Ensure code quality**
   ```bash
   npm run lint
   npm run format
   npm run type-check
   ```

3. **Update documentation**
   - Add/update inline comments for complex logic
   - Update README if adding features
   - Update API docs if changing endpoints

4. **Rebase on main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Submitting a PR

1. Push your branch to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub with:
   - **Clear title** following commit message format
   - **Description** of changes and motivation
   - **Links** to related issues
   - **Screenshots** for UI changes
   - **Testing notes** explaining how to verify changes

3. PR template:
   ```markdown
   ## Description
   Brief description of changes.

   ## Related Issue
   Closes #123

   ## Changes Made
   - Change 1
   - Change 2
   - Change 3

   ## Testing
   How to test these changes:
   1. Step 1
   2. Step 2

   ## Screenshots
   (If applicable)

   ## Checklist
   - [ ] Tests pass
   - [ ] Linting passes
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### PR Review Process

- All PRs require at least 2 approvals
- Address reviewer comments or open discussion
- Ensure CI/CD checks pass
- Squash commits if requested
- Rebase on main before merging

## Reporting Issues

### Security Issues

**Do not** open public issues for security vulnerabilities. Email security@vitaltrack.io with:
- Vulnerability description
- Affected components
- Potential impact
- Suggested fix (if applicable)

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots/logs if applicable

### Feature Requests

Include:
- Clear description of desired functionality
- Use case and motivation
- Proposed implementation (if applicable)
- Acceptance criteria

## Documentation

### Code Comments

- Comment **why**, not **what**
- Use JSDoc for public functions
- Keep comments up-to-date with code

```typescript
// ✅ Good
/**
 * Calculates optimal reorder point for inventory items
 * based on lead time and average daily usage.
 * 
 * @param leadTimeDays - Supplier lead time in days
 * @param averageDailyUsage - Average daily consumption
 * @param safetyStock - Safety stock multiplier (default: 1.5)
 * @returns Reorder point quantity
 */
function calculateReorderPoint(
  leadTimeDays: number,
  averageDailyUsage: number,
  safetyStock: number = 1.5
): number {
  return (leadTimeDays * averageDailyUsage) * safetyStock;
}
```

### Documentation Structure

- `/docs/api/` - API endpoints and usage
- `/docs/architecture/` - System design and patterns
- `/docs/development/` - Developer guides
- `/docs/operations/` - Operations and deployment

## Performance Guidelines

- Monitor bundle size
- Optimize images and assets
- Implement code splitting
- Use Next.js Image optimization
- Profile and benchmark critical paths

## Resources

- [Project README](README.md)
- [Architecture Documentation](docs/architecture/)
- [API Documentation](docs/api/)
- [Development Guide](docs/development/)
- [Roadmap](ROADMAP.md)

## Questions or Need Help?

- **GitHub Issues**: Open an issue for questions
- **Discussions**: Use GitHub Discussions for longer conversations
- **Email**: dev@vitaltrack.io
- **Slack**: Join our developer community (link in README)

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes for their contributions
- GitHub contributors page

Thank you for helping make VitalTrack better! 🚀

---

**Last Updated**: 2026-06-25
