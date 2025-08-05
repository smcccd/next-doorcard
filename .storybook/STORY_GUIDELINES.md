# Storybook Story Guidelines

This document outlines the standards and best practices for creating component
stories in this project.

## File Structure

### Story File Location

- Place story files next to their corresponding components
- Use the naming convention: `ComponentName.stories.tsx`

### Story File Template

Use the template in `.storybook/story-template.tsx` as a starting point for new
stories.

## Story Organization

### Hierarchical Naming

Use consistent hierarchical naming for story titles:

```typescript
title: "Category/ComponentName";
```

**Categories:**

- `UI/` - Basic UI components (buttons, inputs, cards)
- `Navigation/` - Navigation-related components
- `Layout/` - Layout and structural components
- `Forms/` - Form-related components
- `Data/` - Data display components
- `Feedback/` - Toast, alerts, loading states
- `Design System/` - Design system documentation

### Required Story Types

Every component should include these standard stories:

#### 1. Default Story

```typescript
export const Default: Story = {
  args: {
    // Minimal working example
  },
};
```

#### 2. Interactive Story (if applicable)

```typescript
export const Interactive: Story = {
  args: {
    // Shows all controls working
  },
};
```

#### 3. All Variants (if applicable)

```typescript
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {/* Show all visual variants */}
    </div>
  ),
};
```

#### 4. Accessibility Test Story

```typescript
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "keyboard", enabled: true },
        ],
      },
    },
  },
};
```

## Meta Configuration

### Standard Meta Structure

```typescript
const meta = {
  title: "Category/ComponentName",
  component: YourComponent,
  parameters: {
    layout: "centered", // or "fullscreen" or "padded"
    docs: {
      description: {
        component: "Clear description of component purpose and usage.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    // Comprehensive prop documentation
  },
  args: {
    // Sensible defaults
  },
} satisfies Meta<typeof YourComponent>;
```

### ArgTypes Best Practices

#### Controls Configuration

```typescript
argTypes: {
  variant: {
    control: { type: "select" },
    options: ["default", "primary", "secondary"],
    description: "Visual style variant",
  },
  size: {
    control: { type: "select" },
    options: ["sm", "md", "lg"],
    description: "Size variant",
  },
  disabled: {
    control: { type: "boolean" },
    description: "Whether the component is disabled",
  },
  children: {
    control: { type: "text" },
    description: "Content to render inside component",
  },
  onClick: {
    action: "clicked",
    description: "Click event handler",
  },
}
```

## Accessibility Testing

### Required A11y Configuration

Every story should include accessibility testing:

```typescript
parameters: {
  a11y: {
    config: {
      rules: [
        { id: 'color-contrast', enabled: true },
        { id: 'aria-required-attr', enabled: true },
        { id: 'aria-valid-attr', enabled: true },
        { id: 'keyboard', enabled: true },
      ],
    },
    context: '#storybook-root',
  },
}
```

### Accessibility Story Requirements

- Include proper ARIA labels and roles
- Test keyboard navigation
- Verify color contrast
- Test with screen readers

## Documentation Standards

### Component Descriptions

```typescript
parameters: {
  docs: {
    description: {
      component: `
        Brief overview of what the component does.

        ## Usage
        Explain when and how to use this component.

        ## Features
        - List key features
        - Highlight important behaviors
      `,
    },
  },
}
```

### Story Descriptions

```typescript
parameters: {
  docs: {
    description: {
      story: "Explain what this specific story demonstrates.",
    },
  },
}
```

## Error Handling

### Error Boundary Integration

All stories benefit from the global error boundary in `preview.tsx`, but for
components that commonly error:

```typescript
export const ErrorState: Story = {
  render: () => (
    <div className="p-4 border border-red-300 rounded-lg bg-red-50">
      {/* Component in error state */}
    </div>
  ),
};
```

### Loading States

For components with async behavior:

```typescript
export const LoadingState: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LoadingSpinner />
      <Component disabled>Loading...</Component>
    </div>
  ),
};
```

## Responsive Design

### Viewport Testing

Use the configured viewport presets:

- Small Mobile (320px)
- Large Mobile (414px)
- Tablet (768px)
- Desktop (1024px)
- Large Desktop (1440px)

### Responsive Story Example

```typescript
export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="w-full space-y-4">
      <div className="w-full max-w-xs">
        <h4>Mobile</h4>
        <Component className="w-full" />
      </div>
      {/* Additional breakpoints */}
    </div>
  ),
};
```

## Performance Considerations

### Story Optimization

- Keep render functions lightweight
- Avoid unnecessary re-renders in story decorators
- Use stable object references for complex props

### Large Dataset Stories

For components that handle large datasets:

```typescript
export const LargeDataset: Story = {
  args: {
    items: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    })),
  },
};
```

## Context Requirements

### Provider Dependencies

Components requiring context providers are handled by the global decorator in
`preview.tsx`:

- `SessionProvider` for authentication
- `DarkModeProvider` for theming
- Error boundaries for error handling

### Custom Context Stories

For components needing specific context:

```typescript
export const WithCustomContext: Story = {
  decorators: [
    (Story) => (
      <CustomProvider value={mockValue}>
        <Story />
      </CustomProvider>
    ),
  ],
};
```

## Testing Integration

### Actions Configuration

Automatically capture events:

```typescript
parameters: {
  actions: {
    argTypesRegex: "^on[A-Z].*",
  },
}
```

### Controls Best Practices

- Use appropriate control types for each prop
- Provide sensible option lists for select controls
- Include helpful descriptions
- Set good default values

## Quality Checklist

Before submitting a story, ensure:

- [ ] Component description is clear and helpful
- [ ] All major variants are covered
- [ ] Accessibility testing is configured
- [ ] Controls work properly for interactive props
- [ ] Error states are handled gracefully
- [ ] Responsive behavior is tested
- [ ] Documentation explains the component's purpose
- [ ] Story names are descriptive
- [ ] Code follows the established patterns

## Common Patterns

### Multi-Variant Display

```typescript
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {variants.map(variant => (
        <Component key={variant} variant={variant}>
          {variant}
        </Component>
      ))}
    </div>
  ),
};
```

### Theme Demonstration

```typescript
export const ThemeComparison: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-white rounded">
        <h4>Light Theme</h4>
        <Component />
      </div>
      <div className="dark p-4 bg-gray-900 rounded">
        <h4 className="text-white">Dark Theme</h4>
        <Component />
      </div>
    </div>
  ),
};
```

This standardization ensures consistency, improves maintainability, and provides
a better developer experience across the entire component library.
