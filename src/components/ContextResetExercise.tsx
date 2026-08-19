import { useState } from "react";
import { useLanguage } from "../i18n/language";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ContextResetExercise() {
  const { t } = useLanguage();
  const [context, setContext] = useState(() => t("context.defaultNote"));
  return <Card className="context-exercise"><CardHeader><span className="eyebrow">{t("context.reset")}</span><CardTitle>{t("context.title")}</CardTitle></CardHeader><CardContent><p>{context || t("context.cleared")}</p><div className="dialog-actions"><Button variant="ghost" onClick={() => setContext("")} disabled={!context}>{t("context.resetAction")}</Button><Button variant="secondary" onClick={() => setContext(t("context.defaultNote"))}>{t("context.restore")}</Button></div></CardContent></Card>;
}
