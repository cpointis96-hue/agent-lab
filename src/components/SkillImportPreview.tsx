import type { ImportFile } from "../domain/skills";
import { useLanguage } from "../i18n/language";
import { TrustBadge } from "./TrustBadge";

export function SkillImportPreview({ skillName, files, collisions, hasExecutableLookingFiles, onCancel, onImport }: { skillName: string; files: ImportFile[]; collisions: string[]; hasExecutableLookingFiles: boolean; onCancel: () => void; onImport: () => void }) {
  const { t } = useLanguage();
  return <div className="modal-backdrop"><section className="agent-dialog skill-import-dialog" role="dialog" aria-label={t("skills.importPreview")}><span className="eyebrow">{t("skills.importPreview")}</span><h2>{skillName}</h2><p>{t("skills.nothingCopied")}</p><TrustBadge status={t("trust.localInert")} />{hasExecutableLookingFiles && <p className="template-warning">{t("skills.warning")}</p>}<div className="skill-import-files">{files.map((file) => <code key={file.path}>{file.path} · {file.size} B {file.executableLooking ? `· ${t("skills.scriptLooking")}` : ""}</code>)}</div>{collisions.length > 0 && <p className="template-warning">{t("skills.collision", { items: collisions.join(", ") })}</p>}<div className="dialog-actions"><button className="quiet-button" onClick={onCancel}>{t("dialog.cancel")}</button><button className="primary-button" disabled={collisions.length > 0} onClick={onImport}>{t("skills.import")}</button></div></section></div>;
}
