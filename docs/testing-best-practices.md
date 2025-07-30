# Testing Best Practices: Writing Resilient Tests

This guide helps you write tests that are maintainable and don't break when UI text changes.

## ❌ What Makes Tests Brittle

```typescript
// DON'T: Test exact text strings
expect(screen.getByText("Filter by Campus:")).toBeInTheDocument();

// DON'T: Test implementation details
expect(wrapper.find('.campus-filter')).toHaveLength(1);

// DON'T: Use fragile selectors
expect(screen.getByText("Spring 2024 - Active")).toBeInTheDocument();
```

## ✅ How to Write Resilient Tests

### 1. Test User Behavior, Not Implementation

```typescript
// ✅ Test what users actually do
const campusFilter = screen.getByRole('radiogroup', { name: /campus/i });
await user.click(screen.getByRole('radio', { name: /skyline/i }));
expect(screen.getByRole('radio', { name: /skyline/i })).toBeChecked();
```

### 2. Use Semantic HTML and ARIA Roles

```typescript
// ✅ Query by role (most resilient)
screen.getByRole('button', { name: /search/i })
screen.getByRole('heading', { level: 1 })
screen.getByRole('searchbox')

// ✅ Query by label (user-facing)
screen.getByLabelText(/search.*professor/i)

// ✅ Query by accessible description
screen.getByRole('combobox', { name: /department/i })
```

### 3. Use Strategic Test IDs for Complex Components

```typescript
// ✅ Add test IDs for components that are hard to query semantically
<div data-testid="professor-card">
  <!-- Complex nested content -->
</div>

// Then query it
screen.getByTestId('professor-card')
```

### 4. Use Page Object Models

```typescript
// ✅ Encapsulate interactions in Page Objects
class HomePageObject {
  async searchForProfessor(name: string) {
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, name);
  }

  async selectCampus(campus: 'SKYLINE' | 'CSM' | 'CANADA') {
    const radio = screen.getByRole('radio', { name: new RegExp(campus, 'i') });
    await user.click(radio);
  }
}
```

### 5. Create Flexible Assertions

```typescript
// ❌ Brittle - exact text match
expect(screen.getByText("Dr. John Smith - Fall 2024")).toBeInTheDocument();

// ✅ Resilient - pattern matching
expect(screen.getByText(/john smith/i)).toBeInTheDocument();

// ✅ Even better - test the functionality
expect(screen.getByRole('link', { name: /john smith/i })).toHaveAttribute('href', '/professor/john-smith');
```

## Component Design for Testability

### Add Semantic HTML

```tsx
// ✅ Good semantic structure
<section role="search" aria-label="Find professors">
  <h2>Search for Your Professor</h2>
  <input 
    type="search" 
    role="searchbox"
    aria-label="Search professors by name"
    placeholder="Enter professor's name"
  />
  
  <fieldset>
    <legend>Campus</legend>
    <label>
      <input type="radio" name="campus" value="SKYLINE" />
      Skyline College
    </label>
  </fieldset>
</section>
```

### Strategic Test IDs

```tsx
// Add test IDs only when semantic queries aren't sufficient
<div 
  data-testid="professor-card"
  role="article" 
  aria-labelledby={`prof-${id}-name`}
>
  <h3 id={`prof-${id}-name`}>{professor.name}</h3>
  <p>{professor.office}</p>
</div>
```

## Test Utilities

Use our test utilities for consistency:

```typescript
import { HomePageObject } from '@/lib/test-page-objects';
import { testHelpers, mockData } from '@/lib/test-utils';

const homePage = new HomePageObject();
await homePage.searchForProfessor('Smith');
homePage.expectProfessorCardsVisible();
```

## Testing Checklist

Before writing a test, ask:

- [ ] Am I testing what the user actually does?
- [ ] Will this test break if we change the button text?
- [ ] Am I using the most semantic query possible?
- [ ] Would a screen reader user be able to find this element?
- [ ] Is this testing behavior, not implementation?

## Examples by Pattern

### Search Functionality
```typescript
// ✅ Test the search behavior
it('filters professors when searching', async () => {
  render(<HomePage />);
  
  await homePage.searchForProfessor('Smith');
  
  // Test results, not exact UI text
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(screen.getByText(/smith/i)).toBeInTheDocument();
});
```

### Form Interactions
```typescript
// ✅ Test form completion flow
it('allows creating a new doorcard', async () => {
  render(<NewDoorcardForm />);
  
  await formHelpers.fillSelect(/campus/i, 'Skyline');
  await formHelpers.fillSelect(/term/i, 'Fall');
  await formHelpers.fillInput(/year/i, '2024');
  await formHelpers.clickButton(/continue/i);
  
  expect(screen.getByRole('heading', { name: /basic info/i })).toBeInTheDocument();
});
```

### Navigation
```typescript
// ✅ Test navigation flow
it('navigates to professor page when clicked', async () => {
  render(<HomePage />);
  
  const professorLink = screen.getByRole('link', { name: /john smith/i });
  await user.click(professorLink);
  
  expect(mockPush).toHaveBeenCalledWith('/professor/john-smith');
});
```

## Migration Strategy

1. **Identify brittle tests** - Look for `getByText` with exact strings
2. **Add semantic markup** - Ensure components have proper roles/labels  
3. **Update queries gradually** - Use role-based queries where possible
4. **Create page objects** - For complex interaction patterns
5. **Add strategic test IDs** - Only where semantic queries aren't sufficient

Following these practices will make your tests much more maintainable and reduce false failures when the UI evolves.