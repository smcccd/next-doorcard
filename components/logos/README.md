# Logo Components

This directory contains React components for various logos used in the
application.

## Components

### SkylineLogo

A React component for the Skyline College logo with customizable colors and
dimensions.

#### Props

- `className?: string` - Additional CSS classes to apply to the SVG
- `width?: number | string` - Width of the logo (default: 574.68)
- `height?: number | string` - Height of the logo (default: 202.23)
- `fill?: string` - Primary color for the logo (red parts, default: '#ee3c39')
- `secondaryFill?: string` - Secondary color for the logo (text parts, default:
  '#231f20')

#### Usage

```tsx
import { SkylineLogo } from '@/components/logos';

// Default usage
<SkylineLogo />

// Custom size
<SkylineLogo width={400} height={140} />

// Custom colors
<SkylineLogo
  fill="#0066cc"
  secondaryFill="#333333"
  className="shadow-lg"
/>

// Responsive
<SkylineLogo width="100%" height="auto" />
```

#### Features

- Fully customizable colors
- Responsive sizing support
- TypeScript support
- Storybook documentation
- Maintains original aspect ratio
- Accessible SVG structure

### CSMLogo

A React component for the College of San Mateo logo with customizable colors and
dimensions. Based on the official white signature logo from
[collegeofsanmateo.edu](https://collegeofsanmateo.edu/images/logo/csm_signature_white.svg).

#### Props

- `className?: string` - Additional CSS classes to apply to the SVG
- `width?: number | string` - Width of the logo (default: 560.4)
- `height?: number | string` - Height of the logo (default: 110.8)
- `fill?: string` - Color for the logo (default: '#ffffff')

#### Usage

```tsx
import { CSMLogo } from '@/components/logos';

// Default usage (white on dark background)
<CSMLogo />

// Custom size
<CSMLogo width={400} height={80} />

// Custom color
<CSMLogo
  fill="#0066cc"
  className="shadow-lg"
/>

// Responsive
<CSMLogo width="100%" height="auto" />
```

#### Features

- Fully customizable colors
- Responsive sizing support
- TypeScript support
- Storybook documentation
- Maintains original aspect ratio
- Accessible SVG structure
- Based on official CSM branding

## Adding New Logos

When adding new logo components:

1. Create the component file (e.g., `NewLogo.tsx`)
2. Add TypeScript interfaces for props
3. Create a Storybook story (e.g., `NewLogo.stories.tsx`)
4. Export from `index.ts`
5. Update this README
6. Follow the same pattern as `SkylineLogo`
