import { useEffect, useMemo, useState } from "react";
import { fileCatalog, type FileGroup } from "../domain/fileCatalog";
import { fileContent } from "../i18n/catalog";
import { FileInspector } from "./FileInspector";
import type { UiMode } from "../domain/uiMode";
import { useLanguage } from "../i18n/language";

export function FileCatalog({ mode }: { mode: UiMode }) {
  const { t, resolvedLocale } = useLanguage();
  const roleFor = (item: typeof fileCatalog[number]) => fileContent[resolvedLocale][item.id as keyof typeof fileContent.en]?.[0] ?? item.role;
  const [selectedId, setSelectedId] = useState(fileCatalog[0].id);
  const [showOptional, setShowOptional] = useState(false);
  const [showDetails, setShowDetails] = useState(mode === "learn");
  useEffect(() => setShowDetails(mode === "learn"), [mode]);
  const selected = fileCatalog.find((item) => item.id === selectedId) ?? fileCatalog[0];
  const groups = useMemo(() => {
    const order: FileGroup[] = ["agent", "project", "skills", "run"];
    return order.map((group) => ({ group, items: fileCatalog.filter((item) => item.group === group) })).filter((section) => section.items.length > 0);
  }, []);
  const optionalItems = useMemo(() => fileCatalog.filter((item) => item.group === "optional"), []);
  return <section className="file-catalog" aria-label={t("catalog.fileGuide")}>
    <div className="catalog-heading"><span className="eyebrow">{t("catalog.fileGuide")}</span><span className="catalog-note">{t("catalog.filePurpose")}</span></div>
    {groups.map(({ group, items }) => <div className="catalog-group" key={group}>
      <div className="catalog-group-heading">{t(`catalog.group.${group}` as "catalog.group.agent")}</div>
      <div className="catalog-list">{items.map((item) => <button type="button" key={item.id} aria-pressed={item.id === selected.id} className={`catalog-item ${item.id === selected.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><strong>{item.filename}</strong><small>{roleFor(item)}</small></button>)}</div>
    </div>)}
    {optionalItems.length > 0 && <div className="catalog-optional">
      <button type="button" className="catalog-disclosure" aria-expanded={showOptional} onClick={() => setShowOptional((value) => !value)}><span>{showOptional ? t("catalog.hideOptional") : t("catalog.showOptional")}</span><small>{optionalItems.length}</small></button>
      {showOptional && <div className="catalog-list">{optionalItems.map((item) => <button type="button" key={item.id} aria-pressed={item.id === selected.id} className={`catalog-item ${item.id === selected.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><strong>{item.filename}</strong><small>{roleFor(item)}</small></button>)}</div>}
    </div>}
    <FileInspector item={selected} showDetails={mode === "learn" || showDetails} />
    {mode === "build" && <button className="text-button catalog-why" onClick={() => setShowDetails((value) => !value)}>{showDetails ? t("catalog.hideWhy") : t("catalog.why")}</button>}
  </section>;
}
