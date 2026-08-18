import { describe, expect, it } from "vitest";
import { diffFiles } from "./useProjectFilePoller";

const file = (path: string, revision: string) => ({ path, name: path.split("/").at(-1)!, kind: "markdown", convention: "custom", revision, size: 1 });

describe("project file polling", () => {
  it("coalesces one snapshot into sorted added, removed, and changed sets", () => {
    expect(diffFiles([file("b.md", "1"), file("gone.md", "1"), file("changed.md", "1")], [file("a.md", "1"), file("b.md", "1"), file("changed.md", "2")])).toEqual({ added: ["a.md"], removed: ["gone.md"], changed: ["changed.md"] });
  });
});
