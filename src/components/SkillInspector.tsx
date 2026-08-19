import type { Skill } from "../domain/skills";
import { TrustBadge } from "./TrustBadge";
import { useLanguage } from "../i18n/language";

export function SkillInspector({ skill, assigned, onAssign }: { skill: Skill | null; assigned: boolean; onAssign: (value: boolean) => void }) {
  const { t } = useLanguage();
  if (!skill) return null;
  return <section className="skill-inspector"><div className="trace-heading"><span className="eyebrow">{t("skills.label")}</span><TrustBadge status={skill.trustStatus} /></div><h3>{skill.name}</h3><p>{skill.description}</p><code>{skill.path}/SKILL.md</code><div className="skill-files">{skill.files.map((file) => <span key={file.path}>{file.path} · {file.size} B {file.executableLooking ? `· ${t("skills.scriptLooking")}` : ""}</span>)}</div><button className={assigned ? "primary-button" : "secondary-button"} onClick={() => onAssign(!assigned)}>{assigned ? t("skills.unassign") : t("skills.assign")}</button></section>;
}
