import { useState } from "react";
import type { Proposal } from "../domain/proposals";
import { explainProposal, simplifyProposal } from "../domain/proposals";
import { disabledProvider } from "../domain/ai";
import { useLanguage } from "../i18n/language";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AssistantPanel({ busy, onCancel, onApply }: { busy: boolean; onCancel: () => void; onApply: (proposal: Proposal) => void }) {
  const { t } = useLanguage();
  const [objective, setObjective] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  return <div className="modal-backdrop"><div className="assistant-dialog" role="dialog" aria-label={t("assistant.label")}>
    <div className="assistant-header"><div><span className="eyebrow">{t("assistant.label")}</span><h2>{t("assistant.draft")}</h2></div><Button variant="ghost" onClick={onCancel}>{t("dialog.cancel")}</Button></div>
    <p className="assistant-provider"><strong>{t("assistant.disabled")}</strong> · {t("assistant.localPreview")}</p>
    <label>{t("assistant.objective")}<Input autoFocus value={objective} onChange={(event) => setObjective(event.target.value)} placeholder={t("assistant.placeholder")} /></label>
    <div className="dialog-actions"><Button variant="secondary" onClick={() => { setProposal(disabledProvider.generate({ objective }).proposal); setExplanation(null); }}>{t("assistant.generate")}</Button></div>
    {proposal && <div className="proposal-card"><span className="eyebrow">{t("assistant.proposal")}</span><h3>{proposal.objective}</h3><p>{proposal.explanation}</p><div className="proposal-agents">{proposal.agents.map((agent) => <label key={agent.id}><strong>{agent.name}</strong><textarea value={agent.purpose} rows={2} onChange={(event) => setProposal({ ...proposal, agents: proposal.agents.map((item) => item.id === agent.id ? { ...item, purpose: event.target.value } : item), files: proposal.files.map((file) => file.path.endsWith(`${agent.name.toLowerCase()}/AGENT.md`) ? { ...file, content: `# ${agent.name}\n\n## Purpose\n\n${event.target.value}\n` } : file) })} /></label>)}</div><div className="proposal-files"><strong>{t("templates.files")}</strong>{proposal.files.map((file) => <code key={file.path}>{file.path}</code>)}<strong>{t("templates.edges")}</strong>{proposal.edges.map((edge) => <code key={edge.id}>{edge.source} → {edge.target} · {edge.label}</code>)}</div>{proposal.warnings.map((warning) => <p className="template-warning" key={warning}>{warning}</p>)}{explanation && <p className="assistant-explanation">{explanation}</p>}<div className="dialog-actions"><button className="quiet-button" onClick={() => setExplanation(explainProposal(proposal))}>{t("assistant.explain")}</button><button className="quiet-button" onClick={() => setProposal(simplifyProposal(proposal))}>{t("assistant.simplify")}</button><button className="secondary-button" onClick={onCancel}>{t("dialog.cancel")}</button><button className="primary-button" disabled={busy} onClick={() => onApply(proposal)}>{t("assistant.apply")}</button></div></div>}
  </div></div>;
}
