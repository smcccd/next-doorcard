# Storybook Documentation

This project includes a comprehensive Storybook setup that documents all components in the Faculty Doorcard application.

## Getting Started

To run Storybook locally:

```bash
npm run storybook
```

This will start Storybook on http://localhost:6006/

## Structure

### UI Components (`components/ui/`)
- **Button** - All button variants, sizes, and states
- **Card** - Card layouts with headers, content, and footers
- **Input** - Text inputs with various types and states
- **Badge** - Status badges and labels
- **Label** - Form labels with accessibility features
- **Select** - Dropdown selections with grouping
- **Checkbox** - Checkboxes with various states
- **Textarea** - Multi-line text inputs
- **Dialog** - Modal dialogs and popups
- **Tabs** - Tabbed navigation components
- **Dropdown Menu** - Context menus and dropdown actions
- **Toast** - Notification toasts with actions

### Navigation Components (`components/`)
- **NavDropdown** - User navigation dropdown menu
- **DarkModeToggle** - Theme switching component
- **SiteIndex** - Breadcrumb navigation
- **CollegeLogo** - College-specific logo components

### Doorcard Components (`components/`)
- **UnifiedDoorcard** - Main doorcard display component
- **ProfileBanner** - Profile completion prompts
- **ErrorBoundary** - Error handling wrapper
- **SMCCDLogo** - District logo component

## Component Categories

### Form Components
All form-related components including inputs, selects, checkboxes, and labels with proper accessibility features.

### Layout Components  
Navigation, headers, footers, and structural components that make up the application layout.

### Domain-Specific Components
Components specific to the faculty doorcard application, including schedule displays and college branding.

## Features

### Dark Mode Support
Most components include dark mode variants and can be tested with both light and dark backgrounds.

### Responsive Design
Components are tested across different viewport sizes using Storybook's viewport addon.

### Accessibility
Components follow WCAG guidelines and include proper ARIA labels and keyboard navigation.

### Interactive Examples
Stories include interactive examples showing real-world usage patterns and edge cases.

## Mock Data

Complex components use realistic mock data that reflects the actual data structures used in the application:

- **Faculty Information**: Names, titles, contact information
- **Schedule Data**: Office hours, classes, meetings
- **College Data**: CSM, Skyline, and Cañada College information
- **User Sessions**: Authentication states and user roles

## Story Organization

Stories are organized by component type and complexity:

1. **Basic Examples**: Default states and simple usage
2. **Variants**: Different styles, sizes, and configurations  
3. **States**: Loading, error, disabled, and interactive states
4. **Real-world Examples**: Complex scenarios and actual usage patterns
5. **Edge Cases**: Long text, missing data, and error conditions

## Testing with Storybook

Use Storybook to:

- **Visual Testing**: See how components look across different states
- **Interaction Testing**: Test user interactions and form submissions
- **Responsive Testing**: Check components on different screen sizes
- **Accessibility Testing**: Verify keyboard navigation and screen reader compatibility
- **Documentation**: Share component APIs and usage patterns with the team

## Building Storybook

To build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

This creates a `storybook-static` directory that can be deployed to any static hosting service.

## Configuration

Storybook is configured with:

- **Next.js Integration**: Full Next.js support including routing and fonts
- **Tailwind CSS**: Complete styling system integration
- **Dark Mode Provider**: Theme switching capabilities
- **Session Provider**: Authentication context for protected components
- **Global Styles**: Application-wide styling and typography

## Contributing

When adding new components:

1. Create a `.stories.tsx` file alongside your component
2. Include at least these story types:
   - Default state
   - All variants/sizes
   - Error/loading states  
   - Dark mode support
   - Real-world usage examples
3. Use descriptive story names and include documentation
4. Add mock data for complex components
5. Test accessibility and responsive behavior

## Team Usage

Use this Storybook to:

- **Design Review**: Present component designs and get feedback
- **Component Documentation**: Share API and usage patterns
- **Quality Assurance**: Test components in isolation
- **Design System**: Maintain consistency across the application
- **Onboarding**: Help new team members understand the component library