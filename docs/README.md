# Documentation

This directory contains all project documentation organized by relevance and
usage.

## Current Documentation

These documents are actively maintained and relevant for ongoing development:

### Architecture & Design

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture overview and
  system design
- **[AUTH-PATTERNS.md](./AUTH-PATTERNS.md)** - Authentication implementation
  patterns and migration guide

### Testing & Quality Assurance

- **[TESTING.md](./TESTING.md)** - Comprehensive testing strategy and
  implementation
- **[CYPRESS-SESSION-RECOMMENDATIONS.md](./CYPRESS-SESSION-RECOMMENDATIONS.md)** -
  Cypress session management best practices
- **[ACCESSIBILITY_TESTING_GUIDE.md](./ACCESSIBILITY_TESTING_GUIDE.md)** - WCAG
  compliance testing for educational institutions

### Development Tools

- **[STORYBOOK.md](./STORYBOOK.md)** - Component documentation and development
  workflow

### Configuration & Setup

- **[ONELOGIN_SETUP.md](./ONELOGIN_SETUP.md)** - OneLogin OIDC authentication
  configuration

### CI/CD & Operations

- **[CI_CD_GUIDE.md](./CI_CD_GUIDE.md)** - Continuous integration and deployment
  guide
- **[CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)** - CI/CD pipeline setup
  instructions
- **[PRODUCTION_IMPORT_GUIDE.md](./PRODUCTION_IMPORT_GUIDE.md)** - Production
  data import procedures

### Third-Party Integrations

- **[CLARITY_INTEGRATION.md](./CLARITY_INTEGRATION.md)** - Microsoft Clarity
  analytics integration

### Testing Best Practices

- **[testing-best-practices.md](./testing-best-practices.md)** - Testing
  guidelines and best practices
- **[ci-optimization.md](./ci-optimization.md)** - CI pipeline optimization
  strategies

## Archived Documentation

The `archive/` directory contains historical documentation that provides
valuable context but is no longer actively maintained:

### Legacy Migration Documents

- **Data migration strategies and analysis**
- **Production deployment checklists**
- **Legacy system investigation reports**
- **User engagement analysis**
- **Individual faculty data quality reports**

### Historical Analysis

- **Campus distribution analysis**
- **Data quality reports**
- **Meeting summaries and decision records**
- **Enterprise migration planning documents**

## Usage Guidelines

### For Developers

- Start with **ARCHITECTURE.md** to understand the system design
- Review **AUTH-PATTERNS.md** for authentication implementation
- Follow **TESTING.md** for testing practices
- Use **STORYBOOK.md** for component development

### For DevOps/Operations

- Refer to **CI_CD_GUIDE.md** for pipeline management
- Use **PRODUCTION_IMPORT_GUIDE.md** for data operations
- Check **ACCESSIBILITY_TESTING_GUIDE.md** for compliance requirements

### For Product Management

- Review archived documents in `archive/` for historical context
- Check `archive/engagement.md` for user adoption insights
- Reference `archive/analysis-summary.md` for campus distribution data

## Maintenance

- **Current documentation** should be updated with significant changes
- **Archived documentation** is preserved for historical reference but not
  updated
- New documentation should be added to the root `docs/` directory unless it's
  immediately obsolete

## Contributing

When adding new documentation:

1. Place active documentation in the root `docs/` directory
2. Use clear, descriptive filenames
3. Include the document in this README.md
4. Follow the existing documentation structure and style
5. Archive documents when they become outdated rather than deleting them

---

**Last Updated**: January 2025
