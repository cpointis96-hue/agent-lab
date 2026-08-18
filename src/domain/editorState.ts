import type { FileDocument } from "./project";
export type EditorStatus = "clean" | "dirty" | "saving" | "conflict" | "error";
export type EditorState = FileDocument & { savedContent: string; status: EditorStatus; error?: string; disk?: FileDocument };
export type EditorAction = { type: "edit"; content: string } | { type: "save-started" } | { type: "saved"; document: FileDocument } | { type: "conflict"; document: FileDocument } | { type: "error"; message: string } | { type: "reload"; document: FileDocument };
export const clean = (document: FileDocument): EditorState => ({ ...document, savedContent: document.content, status: "clean" });
export function reduceEditor(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "edit": return { ...state, content: action.content, status: action.content === state.savedContent ? "clean" : "dirty" };
    case "save-started": return { ...state, status: "saving" };
    case "saved": return { ...action.document, savedContent: action.document.content, status: "clean" };
    case "conflict": return { ...state, status: "conflict", disk: action.document };
    case "reload": return { ...action.document, savedContent: action.document.content, status: "clean" };
    case "error": return { ...state, status: "error", error: action.message };
  }
}
