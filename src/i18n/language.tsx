import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { interpolate, messages, type AppLocale, type MessageKey } from "./catalog";

export type LanguagePreference = "system" | AppLocale;
export const LANGUAGE_STORAGE_KEY = "agent-lab.language";

function isPreference(value: string | null): value is LanguagePreference {
  return value === "system" || value === "en" || value === "fr";
}

export function resolveLocale(preference: LanguagePreference, languages: readonly string[] = typeof navigator === "undefined" ? [] : navigator.languages): AppLocale {
  if (preference !== "system") return preference;
  return languages.some((language) => language.toLowerCase().startsWith("fr")) ? "fr" : "en";
}

export function readLanguagePreference(): LanguagePreference {
  if (typeof localStorage === "undefined") return "system";
  const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isPreference(value) ? value : "system";
}

type LanguageContextValue = {
  language: LanguagePreference;
  resolvedLocale: AppLocale;
  setLanguage: (language: LanguagePreference) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguagePreference>(readLanguagePreference);
  const [systemLanguages, setSystemLanguages] = useState(() => typeof navigator === "undefined" ? [] : [...navigator.languages]);
  const resolvedLocale = resolveLocale(language, systemLanguages);

  useEffect(() => {
    const onLanguageChange = () => setSystemLanguages([...navigator.languages]);
    window.addEventListener("languagechange", onLanguageChange);
    return () => window.removeEventListener("languagechange", onLanguageChange);
  }, []);

  const setLanguage = (next: LanguagePreference) => {
    setLanguageState(next);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    resolvedLocale,
    setLanguage,
    t: (key, values) => interpolate(messages[resolvedLocale][key] ?? messages.en[key] ?? key, values),
  }), [language, resolvedLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
