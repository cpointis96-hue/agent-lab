import type { UiMode } from "../domain/uiMode";

export function ModeSwitch({ mode, busy, onChange }: { mode: UiMode; busy: boolean; onChange: (mode: UiMode) => void }) {
  return <div className="mode-switch" role="group" aria-label="Workspace mode">
    <span className="eyebrow">MODE</span>
    <button className={mode === "learn" ? "selected" : ""} onClick={() => onChange("learn")} disabled={busy}>Learn</button>
    <button className={mode === "build" ? "selected" : ""} onClick={() => onChange("build")} disabled={busy}>Build</button>
  </div>;
}
