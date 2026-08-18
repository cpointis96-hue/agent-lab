import type { DeletePreview } from "../domain/project";

type DeleteAgentDialogProps = {
  preview: DeletePreview;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAgentDialog(
  { preview, busy, onCancel, onConfirm }: DeleteAgentDialogProps,
) {
  return <div className="modal-backdrop"><section className="agent-dialog delete-agent-dialog" role="dialog" aria-label="Delete agent">
    <span className="eyebrow">RECOVERABLE DELETE</span>
    <h2>Delete {preview.agentName}?</h2>
    <p className="file-path-preview">The folder will move to this project’s recovery area. Nothing is permanently deleted.</p>
    <PreviewList label="Files" items={preview.files} empty="No files found." />
    <PreviewList label="Graph edges" items={preview.edges.map((edge) => `${edge.source} —${edge.relation}→ ${edge.target}`)} empty="No graph edges affected." />
    <div className="dialog-actions"><button type="button" className="quiet-button" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="primary-button danger-button" onClick={onConfirm} disabled={busy}>Move to recovery</button></div>
  </section></div>;
}

function PreviewList({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return <div className="delete-preview"><strong>{label} ({items.length})</strong>{items.length ? <ul>{items.map((item) => <li key={item}><code>{item}</code></li>)}</ul> : <p>{empty}</p>}</div>;
}
