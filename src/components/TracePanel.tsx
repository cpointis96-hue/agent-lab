import type { SimulationEvent, SimulationState } from "../domain/simulation";

export function TracePanel({ state, onSelect }: { state: SimulationState; onSelect: (event: SimulationEvent) => void }) {
  return <section className="trace-panel"><div className="trace-heading"><span className="eyebrow">TRACE</span><span>{state.trace.length} event{state.trace.length === 1 ? "" : "s"}</span></div>{state.trace.length === 0 ? <p className="trace-empty">Step through synthetic information. No internal model reasoning is shown.</p> : <div className="trace-list">{state.trace.map((event, index) => <button key={`${event.id}:${index}`} onClick={() => onSelect(event)}><span>00:{String(index + 1).padStart(2, "0")}</span><strong>{event.sender} → {event.receiver}</strong><small>{event.payload}</small></button>)}</div>}</section>;
}
