import { useState } from "react";
import type { Proposal } from "../domain/proposals";
import { explainProposal, simplifyProposal } from "../domain/proposals";
import { disabledProvider } from "../domain/ai";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AssistantPanel({ busy, onCancel, onApply }: { busy: boolean; onCancel: () => void; onApply: (proposal: Proposal) => void }) {
  const [objective, setObjective] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  return <div className="modal-backdrop"><div className="assistant-dialog" role="dialog" aria-label="AI Design Assistant">
    <div className="assistant-header"><div><span className="eyebrow">AI DESIGN ASSISTANT</span><h2>Draft a workflow</h2></div><Button variant="ghost" onClick={onCancel}>Cancel</Button></div>
    <p className="assistant-provider"><strong>Provider disabled</strong> · local deterministic preview · nothing is sent or written until Apply.</p>
    <label>Objective<Input autoFocus value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="e.g. Research a topic, synthesize findings, review the result" /></label>
    <div className="dialog-actions"><Button variant="secondary" onClick={() => { setProposal(disabledProvider.generate({ objective }).proposal); setExplanation(null); }}>Generate preview</Button></div>
    {proposal && <div className="proposal-card"><span className="eyebrow">EDITABLE PROPOSAL</span><h3>{proposal.objective}</h3><p>{proposal.explanation}</p><div className="proposal-agents">{proposal.agents.map((agent) => <label key={agent.id}><strong>{agent.name}</strong><textarea value={agent.purpose} rows={2} onChange={(event) => setProposal({ ...proposal, agents: proposal.agents.map((item) => item.id === agent.id ? { ...item, purpose: event.target.value } : item), files: proposal.files.map((file) => file.path.endsWith(`${agent.name.toLowerCase()}/AGENT.md`) ? { ...file, content: `# ${agent.name}\n\n## Purpose\n\n${event.target.value}\n` } : file) })} /></label>)}</div><div className="proposal-files"><strong>Files</strong>{proposal.files.map((file) => <code key={file.path}>{file.path}</code>)}<strong>Edges</strong>{proposal.edges.map((edge) => <code key={edge.id}>{edge.source} → {edge.target} · {edge.label}</code>)}</div>{proposal.warnings.map((warning) => <p className="template-warning" key={warning}>{warning}</p>)}{explanation && <p className="assistant-explanation">{explanation}</p>}<div className="dialog-actions"><button className="quiet-button" onClick={() => setExplanation(explainProposal(proposal))}>Explain</button><button className="quiet-button" onClick={() => setProposal(simplifyProposal(proposal))}>Simplify</button><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={busy} onClick={() => onApply(proposal)}>Apply proposal</button></div></div>}
  </div></div>;
}
