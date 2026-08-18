import { useState } from "react";
import type { Agent } from "../domain/project";
import { RELATIONS, type Relation, type WorkflowEdge } from "../domain/graph";

export function EdgeInspector({ edge, agents, busy, onCancel, onSave, onDelete }: {
  edge: WorkflowEdge;
  agents: Agent[];
  busy: boolean;
  onCancel: () => void;
  onSave: (edge: WorkflowEdge) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState(edge);
  const update = <K extends keyof WorkflowEdge>(key: K, value: WorkflowEdge[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="modal-backdrop">
    <form className="agent-dialog edge-dialog" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <span className="eyebrow">CONNECTION</span>
      <h2>{agents.find((agent) => agent.id === draft.source)?.name ?? draft.source} → {agents.find((agent) => agent.id === draft.target)?.name ?? draft.target}</h2>
      <label>From<select value={draft.source} onChange={(event) => update("source", event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      <label>To<select value={draft.target} onChange={(event) => update("target", event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      <label>Type<select value={draft.relation} onChange={(event) => update("relation", event.target.value as Relation)}>{RELATIONS.map((relation) => <option key={relation} value={relation}>{relation}</option>)}</select></label>
      <label>Label<input value={draft.label} onChange={(event) => update("label", event.target.value)} placeholder="Validated research report" /></label>
      <label>Description<textarea rows={2} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
      <label>Expected payload<textarea rows={3} value={draft.payload} onChange={(event) => update("payload", event.target.value)} placeholder="Markdown research report" /></label>
      <label className="checkbox-label"><input type="checkbox" checked={draft.blocking} onChange={(event) => update("blocking", event.target.checked)} /> Blocking</label>
      <label>Condition<input value={draft.condition} onChange={(event) => update("condition", event.target.value)} placeholder="When research is complete" /></label>
      <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>{onDelete && <button type="button" className="quiet-button danger-text" onClick={onDelete}>Remove</button>}<button className="primary-button" disabled={busy}>Save relation</button></div>
    </form>
  </div>;
}
