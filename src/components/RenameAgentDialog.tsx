import { useState, type FormEvent } from "react";
import type { Agent } from "../domain/project";

type RenameAgentDialogProps = {
  agent: Agent;
  busy: boolean;
  onCancel: () => void;
  onSave: (newName: string) => void;
};

export function RenameAgentDialog(
  { agent, busy, onCancel, onSave }: RenameAgentDialogProps,
) {
  const [name, setName] = useState(agent.name);
  return (
    <div className="modal-backdrop">
      <form
        className="agent-dialog"
        aria-label="Rename agent"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onSave(name.trim());
        }}
      >
        <span className="eyebrow">RENAME AGENT</span>
        <h2>Rename {agent.name}</h2>
        <label>
          Name
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <p className="file-path-preview">
          Renames <code>{agent.path}</code> on disk.
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="quiet-button"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={busy || !name.trim()}
          >
            Rename agent
          </button>
        </div>
      </form>
    </div>
  );
}
