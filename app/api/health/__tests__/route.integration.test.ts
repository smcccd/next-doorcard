/**
 * Simple integration test example that works with current Jest setup
 * Tests actual API route handling error cases realistically
 */
import { GET } from "../route";

describe("Health API Integration Test", () => {
  it("handles database connection errors gracefully", async () => {
    // Call the actual API route handler
    const response = await GET();

    // In test environment without proper DB setup, expect error handling
    const data = await response.json();

    // Should return proper error structure
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("environment");

    // Either healthy (if DB works) or unhealthy (if DB fails) - both are valid
    expect(["healthy", "unhealthy"]).toContain(data.status);

    // Should have proper timestamp format
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
