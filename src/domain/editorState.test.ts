import { describe, expect, it } from "vitest";
import { clean, reduceEditor } from "./editorState";
const document = { path: "PROJECT.md", content: "initial", revision: "1" };
describe("editor state", () => { it("tracks edits and saving", () => {
  const dirty = reduceEditor(clean(document), { type: "edit", content: "changed" });
  expect(dirty.status).toBe("dirty"); expect(reduceEditor(dirty, { type: "save-started" }).status).toBe("saving");
}); });
