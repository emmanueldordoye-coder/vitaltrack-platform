# Design System

VitalTrack design system and brand assets.

## Structure

```
design/
├── components/
│   ├── buttons.md
│   ├── forms.md
│   ├── tables.md
│   ├── modals.md
│   ├── cards.md
│   ├── navigation.md
│   └── other-components.md
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   ├── shadows.json
│   └── breakpoints.json
├── assets/
│   ├── logos/
│   ├── icons/
│   ├── illustrations/
│   └── brand-guidelines.md
├── patterns/
│   ├── layouts.md
│   ├── forms.md
│   ├── workflows.md
│   └── error-states.md
├── accessibility.md
├── theming.md
└── README.md
```

## Design Tokens

### Colors

**Primary**
- Primary Blue: `#0066CC`
- Primary Light: `#E6F0FF`
- Primary Dark: `#003D99`

**Healthcare Palette**
- Success Green: `#00A86B`
- Warning Orange: `#FF9500`
- Danger Red: `#FF4444`
- Info Blue: `#0066CC`

**Neutrals**
- Gray 900: `#111827`
- Gray 700: `#374151`
- Gray 500: `#6B7280`
- Gray 300: `#D1D5DB`
- Gray 50: `#F9FAFB`
- White: `#FFFFFF`

### Typography

**Font Stack**
- Headings: Inter, sans-serif
- Body: Roboto, sans-serif
- Monospace: Monaco, monospace

**Font Sizes**
- H1: 48px / 3rem
- H2: 36px / 2.25rem
- H3: 24px / 1.5rem
- H4: 20px / 1.25rem
- Body: 16px / 1rem
- Small: 14px / 0.875rem

**Font Weights**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing

8px grid system:

- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)

### Shadows

```css
shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Breakpoints

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## Component Library

### Buttons

```
Primary (Blue)
Secondary (Gray outline)
Success (Green)
Warning (Orange)
Danger (Red)
Disabled (Gray)

Sizes: Small, Medium, Large
```

### Forms

```
Text Inputs
Selects/Dropdowns
Checkboxes
Radio Buttons
Switches
Date Pickers
Text Areas
Error States
Loading States
```

### Tables

```
Sortable columns
Filterable headers
Pagination
Row selection
Row hover states
Empty states
Loading states
Error states
```

### Modals

```
Centered modals
Side panels (drawers)
Confirmation dialogs
Error dialogs
Loading dialogs
```

### Cards

```
Basic cards
Cards with images
Cards with actions
Card lists
Grid layouts
```

## Responsive Design

**Mobile First Approach**

```css
/* Base (mobile) styles */
.component {
  font-size: 1rem;
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    font-size: 1.125rem;
    padding: 1.5rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    font-size: 1.25rem;
    padding: 2rem;
  }
}
```

## Accessibility

### Color Contrast

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Focus indicators: Visible and 2px minimum

### Keyboard Navigation

- Tab order logical and predictable
- Skip links for main content
- Focus management in modals/dialogs

### ARIA

- Semantic HTML preferred
- ARIA labels for icons
- Live regions for updates
- Roles for custom components

## Dark Mode

Dark mode theme support:

```css
/* Light mode (default) */
:root {
  --color-bg: white;
  --color-text: #111827;
  --color-border: #E5E7EB;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1F2937;
    --color-text: #F9FAFB;
    --color-border: #374151;
  }
}
```

## Animation

### Transitions

```css
transition-fast: 100ms
transition-base: 150ms
transition-slow: 300ms

Easing: ease-in-out
```

### Micro-interactions

- Hover states (subtle scale/color)
- Focus states (ring/underline)
- Loading animations (spinners)
- Toast notifications (slide in/out)

## Brand Guidelines

### Logo Usage

- Minimum size: 40px width
- Clear space: 1/2 logo width
- Do not distort or rotate
- Use official colors only

### Typography

- Headlines: Bold, all caps, medium size
- Body copy: Regular, sentence case
- Technical: Monospace for code

### Color Usage

- Primary blue for actions
- Green for success
- Orange for warnings
- Red for errors
- Neutral gray for secondary elements

### Tone

- Professional yet approachable
- Clear and concise
- Healthcare-focused
- Action-oriented

## Implementation

### Tailwind CSS

Design tokens mapped to Tailwind:

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    colors: {
      primary: '#0066CC',
      success: '#00A86B',
      warning: '#FF9500',
      danger: '#FF4444',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
  },
};
```

### CSS Variables

```css
:root {
  --color-primary: #0066CC;
  --color-success: #00A86B;
  --spacing-md: 1rem;
  --font-size-base: 1rem;
}

.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
}
```

## Usage Examples

### Button Component

```html
<!-- Primary -->
<button class="btn btn-primary">Save</button>

<!-- Secondary -->
<button class="btn btn-secondary">Cancel</button>

<!-- Danger -->
<button class="btn btn-danger">Delete</button>

<!-- Loading -->
<button class="btn btn-primary is-loading">
  <span class="spinner"></span> Loading...
</button>
```

## Maintenance

### Updating Tokens

1. Modify `tokens/*.json`
2. Update Tailwind config
3. Test across components
4. Document changes
5. Communicate updates to team

### Component Updates

1. Update component specification
2. Update implementation
3. Add to component library
4. Document usage
5. Test accessibility
6. Update this guide

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Icons](https://fonts.google.com/icons)

## Contributing

When adding new design elements:
1. Follow established patterns
2. Ensure accessibility compliance
3. Document thoroughly
4. Test across browsers
5. Get feedback from team

## Questions?

Contact: design@vitaltrack.io
