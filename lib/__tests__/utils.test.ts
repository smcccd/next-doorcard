import { cn, convertToPST } from "../utils";

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("should handle tailwind conflicts", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "conditional", false && "hidden")).toBe(
        "base conditional"
      );
    });

    it("should handle arrays and objects", () => {
      expect(cn(["class1", "class2"], { class3: true, class4: false })).toBe(
        "class1 class2 class3"
      );
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn(null, undefined)).toBe("");
    });
  });

  describe("convertToPST", () => {
    it("should convert morning times correctly", () => {
      expect(convertToPST("09:30")).toBe("9:30 AM");
      expect(convertToPST("08:00")).toBe("8:00 AM");
      expect(convertToPST("11:45")).toBe("11:45 AM");
    });

    it("should convert afternoon times correctly", () => {
      expect(convertToPST("14:30")).toBe("2:30 PM");
      expect(convertToPST("18:15")).toBe("6:15 PM");
      expect(convertToPST("23:59")).toBe("11:59 PM");
    });

    it("should handle noon and midnight correctly", () => {
      expect(convertToPST("12:00")).toBe("12:00 PM");
      expect(convertToPST("00:00")).toBe("12:00 AM");
      expect(convertToPST("12:30")).toBe("12:30 PM");
      expect(convertToPST("00:15")).toBe("12:15 AM");
    });

    it("should pad minutes correctly", () => {
      expect(convertToPST("09:05")).toBe("9:05 AM");
      expect(convertToPST("15:00")).toBe("3:00 PM");
    });

    it("should handle edge cases", () => {
      expect(convertToPST("01:00")).toBe("1:00 AM");
      expect(convertToPST("13:00")).toBe("1:00 PM");
    });
  });
});
