import type { RecoveryEntry } from "../domain/project";

type RecoveryPanelProps = {
  entries: RecoveryEntry[];
  busy: boolean;
  onRestore: (entry: RecoveryEntry) => void;
};

export function RecoveryPanel({ entries, busy, onRestore }: RecoveryPanelProps) {
  return <section className="recovery-panel" aria-label="Recovery"><span className="eyebrow">RECOVERY</span>{entries.length === 0 ? <p>No recoverable deletions.</p> : <ul>{entries.map((entry) => <li key={entry.actionId}><div><strong>{entry.agentName}</strong><small>{entry.files.length} file{entry.files.length === 1 ? "" : "s"} · {entry.edges.length} edge{entry.edges.length === 1 ? "" : "s"}</small></div><button className="quiet-button" onClick={() => onRestore(entry)} disabled={busy}>Restore</button></li>)}</ul>}</section>;
}
