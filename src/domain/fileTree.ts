import type { ProjectFile } from "./project";
export type FileTreeNode = { kind: "file" | "directory"; path: string; name: string; file?: ProjectFile; children?: FileTreeNode[] };

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = file.path.split("/"); let level = root; let current = "";
    parts.forEach((part, index) => {
      current = current ? `${current}/${part}` : part;
      const existing = level.find((node) => node.path === current);
      if (existing) { level = existing.children ?? []; return; }
      const node: FileTreeNode = index === parts.length - 1 ? { kind: "file", path: current, name: part, file } : { kind: "directory", path: current, name: part, children: [] };
      level.push(node); level = node.children ?? [];
    });
  }
  const order = (node: FileTreeNode) => node.kind === "file" ? 0 : 1;
  const sort = (nodes: FileTreeNode[]) => { nodes.sort((a, b) => order(a) - order(b) || a.path.localeCompare(b.path)); nodes.forEach((node) => node.children && sort(node.children)); };
  sort(root);
  return root;
}
