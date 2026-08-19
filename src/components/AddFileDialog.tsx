import { useMemo, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { fileCatalog } from "../domain/fileCatalog";
import { useLanguage } from "../i18n/language";

type AddFileDialogProps = {
  parentPath: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (name: string, initialContent: string) => void;
};

export function AddFileDialog({ parentPath, busy, onCancel, onSave }: AddFileDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("TOOLS.md");
  const [initialContent, setInitialContent] = useState(fileCatalog.find((item) => item.id === "tools")?.starter ?? "");
  const [presetId, setPresetId] = useState("tools");
  const optionalFiles = fileCatalog.filter((item) => item.visibility === "optional");
  const relativePath = useMemo(() => [parentPath, name.trim()].filter(Boolean).join("/"), [name, parentPath]);

  return <div className="modal-backdrop"><form className="agent-dialog" aria-label={t("dialog.addFile")} onSubmit={(event: FormEvent) => { event.preventDefault(); onSave(name.trim(), initialContent); }}>
    <span className="eyebrow">{t("dialog.newFile")}</span>
    <h2>{t("dialog.addFile")}</h2>
    <label>{t("dialog.startingPoint")}<select value={presetId} onChange={(event) => { const item = optionalFiles.find((candidate) => candidate.id === event.target.value); if (!item) return; setPresetId(item.id); setName(item.filename); setInitialContent(item.starter ?? ""); }}>{optionalFiles.map((item) => <option key={item.id} value={item.id}>{item.filename} — {item.role}</option>)}</select></label>
    <label>{t("dialog.name")}<Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="TOOLS.md" /></label>
    <label>{t("dialog.initialContent")}<Textarea value={initialContent} onChange={(event) => setInitialContent(event.target.value)} rows={5} /></label>
    <p className="file-path-preview">{t("dialog.creates")} <code>{relativePath || "…"}</code></p>
    <div className="dialog-actions"><Button variant="ghost" onClick={onCancel} disabled={busy}>{t("dialog.cancel")}</Button><Button type="submit" disabled={busy || !name.trim()}>{t("dialog.save")}</Button></div>
  </form></div>;
}
