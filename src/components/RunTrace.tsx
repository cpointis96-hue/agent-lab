import type { RunEvent } from "../domain/runs";

export function RunTrace({ events }: { events: RunEvent[] }) {
  return <section className="run-trace panel-section" aria-label="Run events"><div className="section-heading"><span className="eyebrow">EVENTS</span><span className="trust-note">append-only</span></div>{events.length === 0 ? <p className="muted-copy">No events yet.</p> : <ol>{events.map((event) => <li key={`${event.sequence}-${event.kind}`}><code>{event.kind}</code><span>{event.message}</span></li>)}</ol>}</section>;
}
