import { useState, type FormEvent } from "react";
import type { Agent } from "../domain/project";
import { useLanguage } from "../i18n/language";

type RenameAgentDialogProps = {
  agent: Agent;
  busy: boolean;
  onCancel: () => void;
  onSave: (newName: string) => void;
};

export function RenameAgentDialog(
  { agent, busy, onCancel, onSave }: RenameAgentDialogProps,
) {
  const { t } = useLanguage();
  const [name, setName] = useState(agent.name);
  return (
    <div className="modal-backdrop">
      <form
        className="agent-dialog"
        aria-label={t("dialog.renameAgent")}
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onSave(name.trim());
        }}
      >
        <span className="eyebrow">{t("dialog.renameAgent")}</span>
        <h2>{t("dialog.rename")} : {agent.name}</h2>
        <label>
          {t("dialog.name")}
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <p className="file-path-preview">
          {t("dialog.renameOnDisk", { path: agent.path })}
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="quiet-button"
            onClick={onCancel}
            disabled={busy}
          >
            {t("dialog.cancel")}
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={busy || !name.trim()}
          >
            {t("dialog.rename")}
          </button>
        </div>
      </form>
    </div>
  );
}
