import type { DeletePreview } from "../domain/project";
import { useLanguage } from "../i18n/language";

type DeleteAgentDialogProps = {
  preview: DeletePreview;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAgentDialog(
  { preview, busy, onCancel, onConfirm }: DeleteAgentDialogProps,
) {
  const { t } = useLanguage();
  return <div className="modal-backdrop"><section className="agent-dialog delete-agent-dialog" role="dialog" aria-label={t("dialog.deleteRecovery")}>
    <span className="eyebrow">{t("dialog.deleteRecovery")}</span>
    <h2>{t("dialog.moveToRecovery")} : {preview.agentName} ?</h2>
    <p className="file-path-preview">{t("dialog.noPermanentDelete", { count: preview.files.length, plural: preview.files.length === 1 ? "" : "s" })}</p>
    <PreviewList label={t("common.files")} items={preview.files} empty={t("common.noFiles")} />
    <PreviewList label={t("common.edges")} items={preview.edges.map((edge) => `${edge.source} —${edge.relation}→ ${edge.target}`)} empty={t("common.noEdges")} />
    <div className="dialog-actions"><button type="button" className="quiet-button" onClick={onCancel} disabled={busy}>{t("dialog.cancel")}</button><button type="button" className="primary-button danger-button" onClick={onConfirm} disabled={busy}>{t("dialog.moveToRecovery")}</button></div>
  </section></div>;
}

function PreviewList({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return <div className="delete-preview"><strong>{label} ({items.length})</strong>{items.length ? <ul>{items.map((item) => <li key={item}><code>{item}</code></li>)}</ul> : <p>{empty}</p>}</div>;
}
