import type { FileBuildingBlock } from "../domain/fileCatalog";
import { fileContent, fileExamples } from "../i18n/catalog";
import { useLanguage } from "../i18n/language";

export function FileInspector({ item, showDetails = true }: { item: FileBuildingBlock | null; showDetails?: boolean }) {
  const { resolvedLocale, t } = useLanguage();
  if (!item) return <p className="catalog-empty">{t("catalog.chooseFile")}</p>;
  const content = fileContent[resolvedLocale][item.id as keyof typeof fileContent.en];
  const scope = t(`catalog.scope.${item.scope}` as "catalog.scope.agent");
  const lifetime = t(`catalog.lifetime.${item.lifetime}` as "catalog.lifetime.durable");
  const convention = t(`catalog.convention.${item.convention === "agent-lab" ? "agentLab" : item.convention}` as "catalog.convention.agentLab");
  return <article className="file-inspector">
    <div className="catalog-badge"><span>{scope}</span><span>{lifetime}</span><span>{convention}</span></div>
    <h3>{item.filename}</h3>
    <p>{content?.[0] ?? item.role}</p>
    {showDetails && <><dl><dt>{t("catalog.useWhen")}</dt><dd>{content?.[1] ?? item.useWhen}</dd><dt>{t("catalog.avoidWhen")}</dt><dd>{content?.[2] ?? item.avoidWhen}</dd></dl><div className="file-inspector-example"><span className="eyebrow">{t("app.example")}</span><pre>{fileExamples[resolvedLocale][item.id as keyof typeof fileExamples.en] ?? item.example}</pre></div></>}
  </article>;
}
