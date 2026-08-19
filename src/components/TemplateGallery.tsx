import { useState } from "react";
import { WORKFLOW_TEMPLATES, proposalForTemplate, type WorkflowTemplate } from "../templates/workflows";
import { templateContent } from "../i18n/catalog";
import { useLanguage } from "../i18n/language";

export function TemplateGallery({ busy, onCancel, onApply }: { busy: boolean; onCancel: () => void; onApply: (template: WorkflowTemplate) => void }) {
  const [selected, setSelected] = useState(WORKFLOW_TEMPLATES[0]);
  const { t, resolvedLocale } = useLanguage();
  const labelFor = (template: WorkflowTemplate) => templateContent[resolvedLocale][template.id as keyof typeof templateContent.en] ?? [template.name, template.teachingGoal];
  const level = (value: string) => t(`templates.level.${value.toLowerCase()}` as "templates.level.beginner");
  const proposal = proposalForTemplate(selected);
  const selectedLabel = labelFor(selected);
  return <div className="modal-backdrop"><div className="template-dialog">
    <div className="template-header"><div><span className="eyebrow">{t("templates.label")}</span><h2>{t("templates.start")}</h2></div><button className="quiet-button" onClick={onCancel}>{t("dialog.close")}</button></div>
    <div className="template-layout"><div className="template-list">{WORKFLOW_TEMPLATES.map((template) => { const label = labelFor(template); return <button key={template.id} className={`template-item ${template.id === selected.id ? "selected" : ""}`} onClick={() => setSelected(template)}><strong>{label[0]}</strong><small>{level(template.level)} · {template.agents.length} {t("app.agents").toLowerCase()}</small></button>; })}</div><div className="template-preview"><span className="eyebrow">{t("templates.preview")}</span><h3>{selectedLabel[0]}</h3><p>{selectedLabel[1]}</p><div className="template-agents">{selected.agents.length === 0 ? <span>{t("templates.blank")}</span> : selected.agents.map((agent, index) => <span key={agent.name}>{index > 0 && " → "}{agent.name}</span>)}</div><div className="template-files"><strong>{t("templates.files")}</strong>{proposal.files.map((file) => <code key={file.path}>{file.path}</code>)}<strong>{t("templates.edges")}</strong>{proposal.edges.map((edge) => <code key={edge.id}>{edge.source} —{edge.relation}→ {edge.target}</code>)}</div>{selected.warning && <p className="template-warning">{selected.warning}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={onCancel}>{t("dialog.cancel")}</button><button className="primary-button" disabled={busy} onClick={() => onApply(selected)}>{t("templates.apply")}</button></div></div></div>
  </div></div>;
}
