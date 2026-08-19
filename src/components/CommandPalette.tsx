import { useLanguage } from "../i18n/language";

export type PaletteAction = { id: string; label: string; hint?: string; run: () => void };
export function CommandPalette({ actions, onClose }: { actions: PaletteAction[]; onClose: () => void }) {
  const { t } = useLanguage();
  return <div className="modal-backdrop"><div className="command-palette" role="dialog" aria-label={t("app.commandPalette")}><div className="palette-header"><span className="eyebrow">{t("app.commandPalette")}</span><button className="quiet-button" onClick={onClose}>Esc</button></div><div className="palette-list">{actions.map((action) => <button key={action.id} onClick={() => { action.run(); onClose(); }}><strong>{action.label}</strong><small>{action.hint ?? ""}</small></button>)}</div></div></div>;
}
