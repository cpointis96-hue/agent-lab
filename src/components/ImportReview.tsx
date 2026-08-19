import { useLanguage } from "../i18n/language";

export type ImportSummary = { root: string; recognized: string[]; agentFolders: string[]; hasMetadata: boolean };
export function ImportReview({ summary, busy, onCancel, onOpen }: { summary: ImportSummary; busy: boolean; onCancel: () => void; onOpen: () => void }) {
  const { t } = useLanguage();
  return <div className="modal-backdrop"><div className="agent-dialog import-dialog"><span className="eyebrow">{t("dialog.openExisting")}</span><h2>{t("dialog.reviewStructure")}</h2><p>{t("dialog.importNoWrites", { count: summary.agentFolders.length, plural: summary.agentFolders.length === 1 ? "" : "s" })}</p><ul className="import-list">{summary.recognized.map((item) => <li key={item}><code>{item}</code></li>)}</ul><div className="dialog-actions"><button className="secondary-button" onClick={onCancel}>{t("dialog.cancel")}</button><button className="primary-button" disabled={busy} onClick={onOpen}>{t("dialog.openWithoutMoving")}</button></div></div></div>;
}
