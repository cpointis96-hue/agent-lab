import type { SimulationEvent, SimulationState } from "../domain/simulation";
import { useLanguage } from "../i18n/language";

export function TracePanel({ state, onSelect }: { state: SimulationState; onSelect: (event: SimulationEvent) => void }) {
  const { t } = useLanguage();
  return <section className="trace-panel"><div className="trace-heading"><span className="eyebrow">{t("trace.label")}</span><span>{state.trace.length} {state.trace.length === 1 ? t("trace.event") : t("trace.events")}</span></div>{state.trace.length === 0 ? <p className="trace-empty">{t("trace.empty")}</p> : <div className="trace-list">{state.trace.map((event, index) => <button key={`${event.id}:${index}`} onClick={() => onSelect(event)}><span>00:{String(index + 1).padStart(2, "0")}</span><strong>{event.sender} → {event.receiver}</strong><small>{event.payload}</small></button>)}</div>}</section>;
}
