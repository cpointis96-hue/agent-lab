import { useMemo, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

type AddFileDialogProps = {
  parentPath: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (name: string, initialContent: string) => void;
};

export function AddFileDialog({ parentPath, busy, onCancel, onSave }: AddFileDialogProps) {
  const [name, setName] = useState("TOOLS.md");
  const [initialContent, setInitialContent] = useState("");
  const relativePath = useMemo(() => [parentPath, name.trim()].filter(Boolean).join("/"), [name, parentPath]);

  return <div className="modal-backdrop"><form className="agent-dialog" aria-label="Add file" onSubmit={(event: FormEvent) => { event.preventDefault(); onSave(name.trim(), initialContent); }}>
    <span className="eyebrow">NEW FILE</span>
    <h2>Add file</h2>
    <label>Name<Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="TOOLS.md" /></label>
    <label>Initial content<Textarea value={initialContent} onChange={(event) => setInitialContent(event.target.value)} rows={5} /></label>
    <p className="file-path-preview">Creates <code>{relativePath || "…"}</code></p>
    <div className="dialog-actions"><Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy || !name.trim()}>Save</Button></div>
  </form></div>;
}
