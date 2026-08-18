import type { Agent } from "../domain/project";
import type { RunSummary } from "../domain/runs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function RunControls({ agents, selectedAgentId, task, onTask, onStart, busy }: { agents: Agent[]; selectedAgentId: string | null; task: string; onTask: (value: string) => void; onStart: () => void; busy: boolean }) {
  return <section className="run-controls panel-section" aria-label="Start a local run">
    <div className="section-heading"><span className="eyebrow">RUN</span><span className="trust-note">explicit · local</span></div>
    <p className="muted-copy">Starts a deterministic provider call. Sensitive writes stop for approval.</p>
    <Textarea aria-label="Run task" rows={2} value={task} onChange={(event) => onTask(event.target.value)} placeholder="Describe the task for this run" />
    <Button disabled={busy || !selectedAgentId || !task.trim() || agents.length === 0} onClick={onStart}>Start run</Button>
  </section>;
}

export function RunInspector({ run, onApprove, onReject, onCancel, onResume }: { run: RunSummary | null; onApprove: () => void; onReject: () => void; onCancel: () => void; onResume: () => void }) {
  if (!run) return <section className="run-inspector panel-section"><div className="section-heading"><span className="eyebrow">RUN INSPECTOR</span></div><p className="muted-copy">Start a run to inspect durable state, approvals, events, and outputs.</p></section>;
  return <section className="run-inspector panel-section" aria-label="Run inspector">
    <div className="section-heading"><span className="eyebrow">RUN INSPECTOR</span><span className={`run-state ${run.state}`}>{run.state}</span></div>
    <strong>{run.id} · {run.task}</strong>
    <p className="muted-copy">Provider: {run.provider}. Calls: {run.calls}. Cost: {run.estimatedCost ?? "—"} ({run.costSource}).</p>
    {run.lastError && <p className="error-copy">{run.lastError}</p>}
    <div className="dialog-actions">
      {run.state === "waiting" && <><Button onClick={onApprove}>Approve sensitive step</Button><Button variant="ghost" onClick={onReject}>Reject</Button></>}
      {(run.state === "running" || run.state === "waiting") && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      {(run.state === "failed" || run.state === "blocked") && <Button variant="ghost" onClick={onResume}>Resume</Button>}
    </div>
  </section>;
}
