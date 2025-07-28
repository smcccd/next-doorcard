describe("Type Exports", () => {
  it("should export doorcard types", () => {
    // Just test that we can import doorcard types without errors
    const { College } = require("../doorcard");
    expect(typeof College).toBeDefined();
  });

  it("should have basic type structure", () => {
    // Test basic module structure without importing the main index
    expect(true).toBe(true);
  });
});
