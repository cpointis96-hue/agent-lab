import type { RunSummary } from "../domain/runs";
import { useLanguage } from "../i18n/language";

export function UsageSummary({ runs }: { runs: RunSummary[] }) {
  const { t } = useLanguage();
  const calls = runs.reduce((sum, run) => sum + run.calls, 0);
  const input = runs.reduce((sum, run) => sum + (run.inputTokens ?? 0), 0);
  const output = runs.reduce((sum, run) => sum + (run.outputTokens ?? 0), 0);
  return <section className="usage-summary panel-section" aria-label={t("run.usage")}><div className="section-heading"><span className="eyebrow">{t("run.usage")}</span><span className="trust-note">{t("run.noTelemetry")}</span></div><div className="usage-grid"><span><strong>{runs.length}</strong> {runs.length === 1 ? t("run.runsOne") : t("run.runsMany")}</span><span><strong>{calls}</strong> {calls === 1 ? t("run.callsOne") : t("run.callsMany")}</span><span><strong>{input + output}</strong> {t("run.tokensEstimated")}</span></div></section>;
}
