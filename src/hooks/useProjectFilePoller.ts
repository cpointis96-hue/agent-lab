import { useEffect, useRef } from "react";
import type { ProjectFile } from "../domain/project";
import { listProjectFiles } from "../services/projectService";
export const diffFiles = (previous: ProjectFile[], next: ProjectFile[]) => {
  const before = new Map(previous.map((file) => [file.path, file.revision])); const after = new Map(next.map((file) => [file.path, file.revision]));
  return { added: [...after.keys()].filter((path) => !before.has(path)).sort(), removed: [...before.keys()].filter((path) => !after.has(path)).sort(), changed: [...after.keys()].filter((path) => before.has(path) && before.get(path) !== after.get(path)).sort() };
};
export function useProjectFilePoller(root: string | null, onChange: (files: ProjectFile[], diff: ReturnType<typeof diffFiles>) => void, paused = false) {
  const previous = useRef<ProjectFile[]>([]);
  useEffect(() => { if (!root || paused) return; let cancelled = false;
    const poll = async () => { try { const next = await listProjectFiles(root); if (!cancelled) { const change = diffFiles(previous.current, next); previous.current = next; if (change.added.length || change.removed.length || change.changed.length) onChange(next, change); } } catch { /* project errors surface through explicit actions */ } };
    void poll(); const id = window.setInterval(() => void poll(), 1500); return () => { cancelled = true; window.clearInterval(id); };
  }, [root, paused, onChange]);
}
