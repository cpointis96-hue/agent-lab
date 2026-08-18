import { useState } from "react";
import { WORKFLOW_TEMPLATES, proposalForTemplate, type WorkflowTemplate } from "../templates/workflows";

export function TemplateGallery({ busy, onCancel, onApply }: { busy: boolean; onCancel: () => void; onApply: (template: WorkflowTemplate) => void }) {
  const [selected, setSelected] = useState(WORKFLOW_TEMPLATES[0]);
  return <div className="modal-backdrop"><div className="template-dialog">
    <div className="template-header"><div><span className="eyebrow">WORKFLOW TEMPLATES</span><h2>Start from a pattern</h2></div><button className="quiet-button" onClick={onCancel}>Close</button></div>
    <div className="template-layout"><div className="template-list">{WORKFLOW_TEMPLATES.map((template) => <button key={template.id} className={`template-item ${template.id === selected.id ? "selected" : ""}`} onClick={() => setSelected(template)}><strong>{template.name}</strong><small>{template.level} · {template.agents.length} agents</small></button>)}</div><div className="template-preview"><span className="eyebrow">PREVIEW · NO WRITES</span><h3>{selected.name}</h3><p>{selected.teachingGoal}</p><div className="template-agents">{selected.agents.length === 0 ? <span>Blank project</span> : selected.agents.map((agent, index) => <span key={agent.name}>{index > 0 && " → "}{agent.name}</span>)}</div><div className="template-files"><strong>Files</strong>{proposalForTemplate(selected).files.map((file) => <code key={file.path}>{file.path}</code>)}<strong>Edges</strong>{proposalForTemplate(selected).edges.map((edge) => <code key={edge.id}>{edge.source} —{edge.relation}→ {edge.target}</code>)}</div>{selected.warning && <p className="template-warning">{selected.warning}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={busy} onClick={() => onApply(selected)}>Apply exact preview</button></div></div></div>
  </div></div>;
}
