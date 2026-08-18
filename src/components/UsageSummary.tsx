import type { RunSummary } from "../domain/runs";

export function UsageSummary({ runs }: { runs: RunSummary[] }) {
  const calls = runs.reduce((sum, run) => sum + run.calls, 0);
  const input = runs.reduce((sum, run) => sum + (run.inputTokens ?? 0), 0);
  const output = runs.reduce((sum, run) => sum + (run.outputTokens ?? 0), 0);
  return <section className="usage-summary panel-section" aria-label="Local usage summary"><div className="section-heading"><span className="eyebrow">USAGE</span><span className="trust-note">no telemetry</span></div><div className="usage-grid"><span><strong>{runs.length}</strong> runs</span><span><strong>{calls}</strong> calls</span><span><strong>{input + output}</strong> tokens (estimated)</span></div></section>;
}
