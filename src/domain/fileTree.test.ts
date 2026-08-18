import { describe, expect, it } from "vitest";
import { buildFileTree } from "./fileTree";
const file = (path: string) => ({ path, name: path.split("/").at(-1)!, kind: "markdown", convention: "custom", revision: "1", size: 1 });
describe("buildFileTree", () => it("groups nested files without inventing directories", () => {
  expect(buildFileTree([file("PROJECT.md"), file("agents/researcher/AGENT.md")])).toMatchObject([
    { kind: "file", path: "PROJECT.md" }, { kind: "directory", path: "agents", children: [{ kind: "directory", path: "agents/researcher" }] },
  ]);
}));
