# Microsoft Clarity Integration

This document explains how Microsoft Clarity is integrated into the Next.js application.

## Overview

Microsoft Clarity is a user behavior analytics tool that provides insights into how users interact with your website through features like:

- Session recordings
- Heatmaps
- Click tracking
- User journey analysis
- Performance metrics

## Installation

The integration uses the official Microsoft Clarity npm package:

```bash
npm install @microsoft/clarity
```

## Configuration

### Environment Variables

Add your Clarity project ID to your `.env.local` file:

```env
NEXT_PUBLIC_CLARITY_ID=your-clarity-project-id
```

**Important**: The environment variable must start with `NEXT_PUBLIC_` to be accessible on the client side.

### Getting Your Project ID

1. Go to [Microsoft Clarity](https://clarity.microsoft.com/)
2. Sign in and create a project
3. Go to your project Settings > Overview
4. Copy your Project ID (it looks like: `abcd123ef4`)

## Implementation

### Core Components

1. **ClarityInit Component** (`/components/ClarityInit.tsx`)
   - Initializes Clarity when the app loads
   - Only runs on the client side
   - Includes error handling and logging

2. **ClarityUtils Utility** (`/components/ClarityUtils.tsx`)
   - Provides helper functions for tracking custom events
   - Includes methods for tags, identification, and consent

### Integration in Layout

The `ClarityInit` component is added to the root layout (`/app/layout.tsx`) to ensure Clarity loads on every page:

```tsx
import ClarityInit from "@/components/ClarityInit";

// In your layout's return statement:
<ClarityInit />;
```

## Usage Examples

### Tracking Custom Events

```tsx
import ClarityUtils from "@/components/ClarityUtils";

// Track a button click
const handleButtonClick = () => {
  ClarityUtils.trackEvent("button_clicked");
};

// Track form submission
const handleFormSubmit = () => {
  ClarityUtils.trackEvent("form_submitted");
};
```

### Setting Custom Tags

```tsx
import ClarityUtils from "@/components/ClarityUtils";

// Tag users by role
ClarityUtils.setTag("user_role", "faculty");

// Tag by college
ClarityUtils.setTag("college", "SKYLINE");
```

### User Identification

```tsx
import ClarityUtils from "@/components/ClarityUtils";

// Identify a user
ClarityUtils.identify("user_123", undefined, undefined, "John Doe");
```

### Managing Consent

```tsx
import ClarityUtils from "@/components/ClarityUtils";

// Grant consent
ClarityUtils.consent(true);

// Revoke consent
ClarityUtils.consent(false);
```

## Best Practices

1. **Privacy Compliance**: Always respect user privacy and comply with GDPR, CCPA, and other regulations
2. **Meaningful Events**: Track events that provide business value and insights
3. **Avoid Over-tracking**: Don't track every single interaction; focus on key user journeys
4. **Test in Development**: Verify that events are being tracked correctly in your dev environment

## Verification

To verify that Clarity is working:

1. Open your browser's developer console
2. Look for the success message: "✅ Microsoft Clarity initialized successfully"
3. Check the Clarity dashboard for incoming data
4. Look for the custom event "clarity_initialized" in your Clarity project

## Troubleshooting

### Common Issues

1. **"Clarity not initialized" warning**
   - Check that `NEXT_PUBLIC_CLARITY_ID` is set in your environment variables
   - Ensure the variable name starts with `NEXT_PUBLIC_`

2. **No data in Clarity dashboard**
   - Verify your Project ID is correct
   - Check browser console for error messages
   - Ensure you're testing with a real browser (not headless)

3. **Build errors**
   - Make sure the `ClarityInit` component is marked with `"use client"`
   - Check that the import statement is correct: `import Clarity from "@microsoft/clarity"`

### Debug Mode

The integration includes console logging to help with debugging:

- ✅ Success messages when Clarity initializes
- 📊 Event tracking confirmations
- 🏷️ Tag setting confirmations
- ❌ Error messages if something goes wrong

## Additional Features

The Microsoft Clarity npm package supports additional features:

- **Cookie Consent Management**: Integrate with your consent management system
- **Advanced Identification**: Track users across sessions and devices
- **Custom Tags**: Segment your data with custom attributes
- **Event Tracking**: Monitor specific user actions and conversions

For more advanced usage, refer to the [official Microsoft Clarity documentation](https://learn.microsoft.com/en-us/clarity/).
