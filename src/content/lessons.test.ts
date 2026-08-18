import { describe, expect, it } from "vitest";
import { LESSONS, lessonById } from "./lessons";

describe("curriculum", () => {
  it("has twelve ordered lessons", () => {
    expect(LESSONS).toHaveLength(12);
    expect(LESSONS[0].id).toBe("single");
    expect(LESSONS.at(-1)?.id).toBe("simplify");
    expect(lessonById("missing")).toBe(LESSONS[0]);
  });
});
