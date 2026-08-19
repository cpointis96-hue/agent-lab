import type { Agent } from "../domain/project";
import type { RunSummary } from "../domain/runs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useLanguage } from "../i18n/language";

export function RunControls({ agents, selectedAgentId, task, onTask, onStart, busy }: { agents: Agent[]; selectedAgentId: string | null; task: string; onTask: (value: string) => void; onStart: () => void; busy: boolean }) {
  const { t } = useLanguage();
  return <section className="run-controls panel-section" aria-label={t("run.start")}>
    <div className="section-heading"><span className="eyebrow">{t("run.label")}</span><span className="trust-note">{t("run.explicitLocal")}</span></div>
    <h3 className="run-section-title">{t("run.start")}</h3>
    <p className="muted-copy">{t("run.description")}</p>
    <label className="run-task-label">{t("run.taskLabel")}<Textarea aria-label={t("run.taskLabel")} rows={2} value={task} onChange={(event) => onTask(event.target.value)} placeholder={t("run.taskPlaceholder")} /></label>
    <Button disabled={busy || !selectedAgentId || !task.trim() || agents.length === 0} onClick={onStart}>{t("run.start")}</Button>
  </section>;
}

export function RunInspector({ run, onApprove, onReject, onCancel, onResume }: { run: RunSummary | null; onApprove: () => void; onReject: () => void; onCancel: () => void; onResume: () => void }) {
  const { t } = useLanguage();
  const stateLabel = (state: RunSummary["state"]) => t(`app.runState.${state}` as "app.runState.idle");
  if (!run) return <section className="run-inspector panel-section"><div className="section-heading"><span className="eyebrow">{t("run.inspector")}</span></div><p className="muted-copy">{t("run.inspectorEmpty")}</p></section>;
  return <section className="run-inspector panel-section" aria-label={t("run.inspector")}>
    <div className="section-heading"><span className="eyebrow">{t("run.inspector")}</span><span className={`run-state ${run.state}`}>{stateLabel(run.state)}</span></div>
    <strong className="run-inspector-title">{run.id} · {run.task}</strong>
    <p className="muted-copy">{t("run.localSummary", { calls: run.calls, callLabel: run.calls === 1 ? t("run.callsOne") : t("run.callsMany"), cost: run.estimatedCost ?? "—" })}</p>
    {run.lastError && <p className="error-copy">{run.lastError}</p>}
    <div className="dialog-actions">
      {run.state === "waiting" && <><Button onClick={onApprove}>{t("run.approve")}</Button><Button variant="ghost" onClick={onReject}>{t("run.reject")}</Button></>}
      {(run.state === "running" || run.state === "waiting") && <Button variant="ghost" onClick={onCancel}>{t("run.cancel")}</Button>}
      {(run.state === "failed" || run.state === "blocked") && <Button variant="ghost" onClick={onResume}>{t("run.resume")}</Button>}
    </div>
  </section>;
}
