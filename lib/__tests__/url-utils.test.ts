import { describe, it, expect } from "vitest";
import { getPrintUrl, hasQueryParams, hasFragment } from "../url-utils";

describe("getPrintUrl", () => {
  describe("basic URL handling", () => {
    it("should add ? when no query params exist", () => {
      expect(getPrintUrl("/view/testuser")).toBe("/view/testuser?print=true");
    });

    it("should add & when query params exist", () => {
      expect(getPrintUrl("/view/testuser?theme=dark")).toBe(
        "/view/testuser?theme=dark&print=true"
      );
    });

    it("should handle admin URLs with auth parameter", () => {
      expect(getPrintUrl("/doorcard/123/view?auth=true")).toBe(
        "/doorcard/123/view?auth=true&print=true"
      );
    });

    it("should handle root paths", () => {
      expect(getPrintUrl("/")).toBe("/?print=true");
    });

    it("should handle URLs with multiple query params", () => {
      expect(getPrintUrl("/view/user?theme=dark&lang=en")).toBe(
        "/view/user?theme=dark&lang=en&print=true"
      );
    });
  });

  describe("fragment handling", () => {
    it("should properly handle URLs with fragments", () => {
      expect(getPrintUrl("/view/user#schedule")).toBe(
        "/view/user?print=true#schedule"
      );
    });

    it("should handle URLs with both query params and fragments", () => {
      expect(getPrintUrl("/view/user?theme=dark#schedule")).toBe(
        "/view/user?theme=dark&print=true#schedule"
      );
    });

    it("should handle fragments with special characters", () => {
      expect(getPrintUrl("/view/user#office-hours")).toBe(
        "/view/user?print=true#office-hours"
      );
    });

    it("should handle empty fragments", () => {
      expect(getPrintUrl("/view/user#")).toBe("/view/user?print=true#");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      expect(getPrintUrl("")).toBe("?print=true");
    });

    it("should handle URLs with encoded characters", () => {
      expect(getPrintUrl("/view/user%20name")).toBe(
        "/view/user%20name?print=true"
      );
    });

    it("should handle URLs with special characters in query params", () => {
      expect(getPrintUrl("/view/user?name=John%20Doe")).toBe(
        "/view/user?name=John%20Doe&print=true"
      );
    });

    it("should handle URLs with port numbers", () => {
      expect(getPrintUrl("http://localhost:3000/view/user")).toBe(
        "http://localhost:3000/view/user?print=true"
      );
    });

    it("should handle absolute URLs", () => {
      expect(getPrintUrl("https://example.com/view/user")).toBe(
        "https://example.com/view/user?print=true"
      );
    });

    it("should handle URLs with trailing slashes", () => {
      expect(getPrintUrl("/view/user/")).toBe("/view/user/?print=true");
    });
  });

  describe("real-world scenarios from the app", () => {
    it("should handle live doorcard URLs", () => {
      expect(getPrintUrl("/view/besnyib")).toBe("/view/besnyib?print=true");
    });

    it("should handle admin doorcard URLs", () => {
      expect(getPrintUrl("/doorcard/cm1234567/view?auth=true")).toBe(
        "/doorcard/cm1234567/view?auth=true&print=true"
      );
    });

    it("should handle public doorcard URLs with slugs", () => {
      expect(getPrintUrl("/view/john-doe-2024")).toBe(
        "/view/john-doe-2024?print=true"
      );
    });
  });
});

describe("hasQueryParams", () => {
  it("should return true for URLs with query params", () => {
    expect(hasQueryParams("/view/user?theme=dark")).toBe(true);
    expect(hasQueryParams("?print=true")).toBe(true);
    expect(hasQueryParams("/doorcard/123/view?auth=true")).toBe(true);
  });

  it("should return false for URLs without query params", () => {
    expect(hasQueryParams("/view/user")).toBe(false);
    expect(hasQueryParams("/")).toBe(false);
    expect(hasQueryParams("")).toBe(false);
  });

  it("should ignore fragments when checking for query params", () => {
    expect(hasQueryParams("/view/user#schedule")).toBe(false);
    expect(hasQueryParams("/view/user?theme=dark#schedule")).toBe(true);
  });
});

describe("hasFragment", () => {
  it("should return true for URLs with fragments", () => {
    expect(hasFragment("/view/user#schedule")).toBe(true);
    expect(hasFragment("#top")).toBe(true);
    expect(hasFragment("/view/user?theme=dark#schedule")).toBe(true);
  });

  it("should return false for URLs without fragments", () => {
    expect(hasFragment("/view/user")).toBe(false);
    expect(hasFragment("/view/user?theme=dark")).toBe(false);
    expect(hasFragment("")).toBe(false);
  });
});
