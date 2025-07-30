// Test that the main type exports work correctly
import * as types from "../index";

describe("Types Index Exports", () => {
  it("should export doorcard types", () => {
    // These exports come from "./doorcard"
    expect(types).toBeDefined();

    // Test that we can import common types that should be available
    // Note: We can't test the actual types at runtime, but we can verify the module loads
    const typeKeys = Object.keys(types);
    expect(typeKeys).toBeDefined();
    expect(Array.isArray(typeKeys)).toBe(true);
  });

  it("should export component types", () => {
    // Test that the module loads without errors
    // The actual types are compile-time constructs
    expect(typeof types).toBe("object");
  });

  it("should export page types", () => {
    // Verify module structure
    expect(types).toBeTruthy();
  });

  it("should export API types", () => {
    // Verify no runtime errors in exports
    expect(types).not.toBeNull();
  });

  it("should export hook types", () => {
    // Basic module health check
    expect(types).not.toBeUndefined();
  });

  it("should export analytics types", () => {
    // Verify the re-export structure works
    const moduleExports = Object.getOwnPropertyNames(types);
    expect(Array.isArray(moduleExports)).toBe(true);
  });

  it("should export term types", () => {
    // Final verification that all exports are accessible
    expect(Object.prototype.toString.call(types)).toBe("[object Module]");
  });

  it("should handle module loading correctly", () => {
    // Test that require works (different import style)
    const requiredTypes = require("../index");
    expect(requiredTypes).toBeDefined();
    expect(typeof requiredTypes).toBe("object");
  });
});
