import { useState } from "react";
import type { Agent } from "../domain/project";
import { RELATIONS, type Relation, type WorkflowEdge } from "../domain/graph";
import { useLanguage } from "../i18n/language";

export function EdgeInspector({ edge, agents, busy, onCancel, onSave, onDelete }: {
  edge: WorkflowEdge;
  agents: Agent[];
  busy: boolean;
  onCancel: () => void;
  onSave: (edge: WorkflowEdge) => void;
  onDelete?: () => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(edge);
  const update = <K extends keyof WorkflowEdge>(key: K, value: WorkflowEdge[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="modal-backdrop">
    <form className="agent-dialog edge-dialog" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <span className="eyebrow">{t("app.connectAgents")}</span>
      <h2>{agents.find((agent) => agent.id === draft.source)?.name ?? draft.source} → {agents.find((agent) => agent.id === draft.target)?.name ?? draft.target}</h2>
      <label>{t("dialog.from")}<select value={draft.source} onChange={(event) => update("source", event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      <label>{t("dialog.to")}<select value={draft.target} onChange={(event) => update("target", event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      <label>{t("dialog.type")}<select value={draft.relation} onChange={(event) => update("relation", event.target.value as Relation)}>{RELATIONS.map((relation) => <option key={relation} value={relation}>{relation}</option>)}</select></label>
      <label>{t("dialog.label")}<input value={draft.label} onChange={(event) => update("label", event.target.value)} placeholder={t("dialog.reportPlaceholder")} /></label>
      <label>{t("dialog.description")}<textarea rows={2} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
      <label>{t("dialog.expectedPayload")}<textarea rows={3} value={draft.payload} onChange={(event) => update("payload", event.target.value)} placeholder={t("dialog.markdownPlaceholder")} /></label>
      <label className="checkbox-label"><input type="checkbox" checked={draft.blocking} onChange={(event) => update("blocking", event.target.checked)} /> {t("dialog.blocking")}</label>
      <label>{t("dialog.condition")}<input value={draft.condition} onChange={(event) => update("condition", event.target.value)} placeholder={t("dialog.conditionPlaceholder")} /></label>
      <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onCancel}>{t("dialog.cancel")}</button>{onDelete && <button type="button" className="quiet-button danger-text" onClick={onDelete}>{t("dialog.deleteRecovery")}</button>}<button className="primary-button" disabled={busy}>{t("dialog.save")}</button></div>
    </form>
  </div>;
}
