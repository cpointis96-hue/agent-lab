import { useEffect, useState } from "react";
import { fileCatalog } from "../domain/fileCatalog";
import { FileInspector } from "./FileInspector";
import type { UiMode } from "../domain/uiMode";

export function FileCatalog({ mode }: { mode: UiMode }) {
  const [selectedId, setSelectedId] = useState(fileCatalog[0].id);
  const [showDetails, setShowDetails] = useState(mode === "learn");
  useEffect(() => setShowDetails(mode === "learn"), [mode]);
  const selected = fileCatalog.find((item) => item.id === selectedId) ?? fileCatalog[0];
  return <section className="file-catalog" aria-label="File building block catalog">
    <div className="catalog-heading"><span className="eyebrow">FILE GUIDE</span><span className="catalog-note">What each file is for</span></div>
    <div className="catalog-list">{fileCatalog.map((item) => <button key={item.id} className={`catalog-item ${item.id === selected.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><strong>{item.filename}</strong><small>{item.role}</small></button>)}</div>
    <FileInspector item={selected} showDetails={mode === "learn" || showDetails} />
    {mode === "build" && <button className="text-button catalog-why" onClick={() => setShowDetails((value) => !value)}>{showDetails ? "Hide why?" : "Why?"}</button>}
  </section>;
}
