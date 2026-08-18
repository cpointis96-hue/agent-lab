import type { Skill } from "../domain/skills";
import { TrustBadge } from "./TrustBadge";

export function SkillInspector({ skill, assigned, onAssign }: { skill: Skill | null; assigned: boolean; onAssign: (value: boolean) => void }) {
  if (!skill) return <section className="skill-inspector"><span className="eyebrow">SKILLS</span><p>Select a local skill to inspect it.</p></section>;
  return <section className="skill-inspector"><div className="trace-heading"><span className="eyebrow">SKILL</span><TrustBadge status={skill.trustStatus} /></div><h3>{skill.name}</h3><p>{skill.description}</p><code>{skill.path}/SKILL.md</code><div className="skill-files">{skill.files.map((file) => <span key={file.path}>{file.path} · {file.size} B {file.executableLooking ? "· script-looking" : ""}</span>)}</div><button className={assigned ? "primary-button" : "secondary-button"} onClick={() => onAssign(!assigned)}>{assigned ? "Unassign from selected agent" : "Assign to selected agent"}</button></section>;
}
