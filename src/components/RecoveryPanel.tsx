import type { RecoveryEntry } from "../domain/project";
import { useLanguage } from "../i18n/language";

type RecoveryPanelProps = {
  entries: RecoveryEntry[];
  busy: boolean;
  onRestore: (entry: RecoveryEntry) => void;
};

export function RecoveryPanel({ entries, busy, onRestore }: RecoveryPanelProps) {
  const { t } = useLanguage();
  return <section className="recovery-panel" aria-label={t("recovery.label")}><span className="eyebrow">{t("recovery.label")}</span>{entries.length === 0 ? <p>{t("recovery.empty")}</p> : <ul>{entries.map((entry) => <li key={entry.actionId}><div><strong>{entry.agentName}</strong><small>{entry.files.length} {t("common.files").toLowerCase()} · {entry.edges.length} {t("common.edges").toLowerCase()}</small></div><button className="quiet-button" onClick={() => onRestore(entry)} disabled={busy}>{t("recovery.restore")}</button></li>)}</ul>}</section>;
}
