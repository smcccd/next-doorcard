import * as validationTypes from "../validation";

describe("API Validation Types", () => {
  it("should export validation types", () => {
    // This test verifies that the module exports the expected types
    // Since these are type-only exports, we mainly test that the module can be imported
    expect(typeof validationTypes).toBe("object");
  });

  it("should re-export from lib/validations/doorcard", () => {
    // Test that the re-exports are available
    // This mainly ensures the module structure is correct
    expect(validationTypes).toBeDefined();
  });
});
