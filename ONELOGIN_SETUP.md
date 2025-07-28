# OneLogin OIDC Configuration

This document explains how to configure OneLogin OIDC authentication for the Faculty Doorcard System.

## Prerequisites

- OneLogin admin access
- OIDC application created in OneLogin

## OneLogin Application Setup

### 1. Create OIDC Application

1. Log into OneLogin Admin Portal
2. Go to **Applications** → **Applications**
3. Click **Add App** → Search for "OpenId Connect (OIDC)"
4. Select **OpenId Connect (OIDC)** application type

### 2. Application Configuration

#### Basic Information

- **Name**: Faculty Doorcard System
- **Description**: Digital office hours system for faculty

#### SSO Tab

- **Application Type**: Web
- **Token Endpoint**: Authentication Method → Client Secret Post
- **Redirect URIs**:
  - Development: `http://localhost:3000/api/auth/callback/onelogin`
  - Production: `https://your-domain.com/api/auth/callback/onelogin`

#### Parameters Tab

Map OneLogin user attributes to OIDC claims:

| OneLogin User Field | OIDC Claim  | Required |
| ------------------- | ----------- | -------- |
| Email               | email       | ✅       |
| First Name          | given_name  | ✅       |
| Last Name           | family_name | ✅       |
| Display Name        | name        | ✅       |
| Department          | college     | Optional |
| Title               | role        | Optional |

### 3. Get Configuration Values

From the **SSO** tab, copy these values:

- **Client ID**: Found in the application details
- **Client Secret**: Generated secret (click "Show")
- **Issuer URL**: `https://your-subdomain.onelogin.com/oidc/2`

## Environment Configuration

Add these variables to your `.env.local`:

```bash
# OneLogin OIDC Configuration
ONELOGIN_CLIENT_ID=your_client_id_here
ONELOGIN_CLIENT_SECRET=your_client_secret_here
ONELOGIN_ISSUER=https://your-subdomain.onelogin.com/oidc/2
```

## User Mapping

The system automatically maps OneLogin users to the database:

- **New Users**: Created automatically on first login
- **Existing Users**: Updated with OneLogin profile data
- **Default Role**: `FACULTY` (can be customized via OneLogin attributes)
- **College**: Mapped from OneLogin department field

## Testing

### Development

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Click "Sign in with SMCCD OneLogin"
4. Complete OneLogin authentication flow

### Production

1. Deploy with environment variables configured
2. Verify callback URL is registered in OneLogin
3. Test authentication flow

## Troubleshooting

### Common Issues

**"Invalid client" error**

- Verify `ONELOGIN_CLIENT_ID` and `ONELOGIN_CLIENT_SECRET`
- Check that the application is enabled in OneLogin

**"Redirect URI mismatch" error**

- Ensure callback URL is exact: `/api/auth/callback/onelogin`
- Verify domain matches between OneLogin config and `NEXTAUTH_URL`

**"User not found" error**

- Check that email claim is being sent from OneLogin
- Verify user attribute mapping in OneLogin Parameters tab

### Debug Mode

Enable NextAuth debug mode for detailed logs:

```bash
NEXTAUTH_DEBUG=true
```

## Security Considerations

- Keep `ONELOGIN_CLIENT_SECRET` secure
- Use HTTPS in production
- Regularly rotate client secrets
- Monitor authentication logs

## Profile Attribute Mapping

| OneLogin Field | Database Field | Purpose               |
| -------------- | -------------- | --------------------- |
| email          | email          | User identification   |
| given_name     | firstName      | Profile display       |
| family_name    | lastName       | Profile display       |
| name           | name           | Fallback display name |
| department     | college        | Campus assignment     |
| title          | role           | User permissions      |

Custom attributes can be added via OneLogin's custom user fields and mapped in the NextAuth provider configuration.
