import type { FileBuildingBlock } from "../domain/fileCatalog";
import { conventionLabel, lifetimeLabel, scopeLabel } from "../domain/fileCatalog";

export function FileInspector({ item, showDetails = true }: { item: FileBuildingBlock | null; showDetails?: boolean }) {
  if (!item) return <p className="catalog-empty">Choose a file to learn when it belongs in your project.</p>;
  return <article className="file-inspector">
    <div className="catalog-badge"><span>{scopeLabel(item.scope)}</span><span>{lifetimeLabel(item.lifetime)}</span><span>{conventionLabel(item.convention)}</span></div>
    <h3>{item.filename}</h3>
    <p>{item.role}</p>
    {showDetails && <><dl><dt>Use when</dt><dd>{item.useWhen}</dd><dt>Avoid when</dt><dd>{item.avoidWhen}</dd></dl><div className="file-inspector-example"><span className="eyebrow">EXAMPLE</span><pre>{item.example}</pre></div></>}
  </article>;
}
