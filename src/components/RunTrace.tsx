import type { RunEvent } from "../domain/runs";
import { useLanguage } from "../i18n/language";
import type { MessageKey } from "../i18n/catalog";

export function RunTrace({ events }: { events: RunEvent[] }) {
  const { t } = useLanguage();
  const eventText = (kind: string, prefix: "run.event" | "run.eventDescription") => {
    const key = `${prefix}.${kind}` as MessageKey;
    const translated = t(key);
    return translated === key ? kind.replaceAll("_", " ") : translated;
  };
  return <section className="run-trace panel-section" aria-label={t("run.events")}><div className="section-heading"><span className="eyebrow">{t("run.events")}</span><span className="trust-note">{t("run.eventsNote")}</span></div>{events.length === 0 ? <p className="muted-copy">{t("run.noEvents")}</p> : <ol>{events.map((event) => <li key={`${event.sequence}-${event.kind}`}><strong>{eventText(event.kind, "run.event")}</strong><span>{eventText(event.kind, "run.eventDescription")}</span></li>)}</ol>}</section>;
}
