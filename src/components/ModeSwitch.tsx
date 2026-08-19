import type { UiMode } from "../domain/uiMode";
import { useLanguage } from "../i18n/language";

export function ModeSwitch({ mode, busy, onChange }: { mode: UiMode; busy: boolean; onChange: (mode: UiMode) => void }) {
  const { t } = useLanguage();
  return <div className="mode-switch" role="group" aria-label={t("mode.label")}>
    <span className="eyebrow">{t("mode.label")}</span>
    <button className={mode === "learn" ? "selected" : ""} onClick={() => onChange("learn")} disabled={busy}>{t("mode.learn")}</button>
    <button className={mode === "build" ? "selected" : ""} onClick={() => onChange("build")} disabled={busy}>{t("mode.build")}</button>
  </div>;
}
