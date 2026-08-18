import type { FileBuildingBlock } from "../domain/fileCatalog";
import { conventionLabel } from "../domain/fileCatalog";

export function FileInspector({ item, showDetails = true }: { item: FileBuildingBlock | null; showDetails?: boolean }) {
  if (!item) return <p className="catalog-empty">Choose a building block to understand its tradeoff.</p>;
  return <article className="file-inspector">
    <div className="catalog-badge">{conventionLabel(item.convention)}</div>
    <h3>{item.filename}</h3>
    <p>{item.role}</p>
    {showDetails && <><dl><dt>Use when</dt><dd>{item.useWhen}</dd><dt>Avoid when</dt><dd>{item.avoidWhen}</dd></dl><pre>{item.example}</pre></>}
  </article>;
}
