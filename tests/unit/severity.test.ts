import { formatSeverity } from "../../src/utils/formatSeverity";

describe("formatSeverity()", () => {
  test("returns 'Low' for severity 1", () => {
    expect(formatSeverity(1)).toBe("Low");
  });

  test("returns 'Moderate' for severity 3", () => {
    expect(formatSeverity(3)).toBe("Moderate");
  });

  test("returns 'High' for severity 5", () => {
    expect(formatSeverity(5)).toBe("High");
  });

  test("handles edge case at threshold correctly", () => {
    expect(formatSeverity(4)).toBe("Moderate");
  });
});
