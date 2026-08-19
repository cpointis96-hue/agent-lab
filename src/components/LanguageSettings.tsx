import { useLanguage, type LanguagePreference } from "../i18n/language";

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="language-setting" title={t("language.settings")}>
      <span>{t("language.label")}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value as LanguagePreference)} aria-label={t("language.label")}>
        <option value="system">{t("language.system")}</option>
        <option value="en">{t("language.english")}</option>
        <option value="fr">{t("language.french")}</option>
      </select>
    </label>
  );
}
