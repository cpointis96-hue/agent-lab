import type { Agent } from "../domain/project";
import type { Skill, SkillAssignment } from "../domain/skills";
import { useLanguage } from "../i18n/language";

export function SkillAssignment({ agents, skills, assignments, selectedAgentId, selectedSkillId, onSelectSkill }: { agents: Agent[]; skills: Skill[]; assignments: SkillAssignment[]; selectedAgentId: string | null; selectedSkillId: string | null; onSelectSkill: (id: string) => void }) {
  const { t } = useLanguage();
  return <section className="skill-assignment"><div className="trace-heading"><span className="eyebrow">{t("skills.library")}</span><span>{skills.length} skill{skills.length === 1 ? "" : "s"}</span></div>{skills.length === 0 ? <p className="trace-empty">{t("skills.empty")}</p> : <div className="skill-list">{skills.map((skill) => <button className={skill.id === selectedSkillId ? "selected" : ""} key={skill.id} onClick={() => onSelectSkill(skill.id)}><strong>{skill.name}</strong><small>{assignments.filter((item) => item.skillId === skill.id).map((item) => agents.find((agent) => agent.id === item.agentId)?.name).filter(Boolean).join(", ") || t("skills.unassigned")}</small></button>)}</div>}{skills.length > 0 && !selectedSkillId && <p className="skill-selection-note">{t("skills.selectToInspect")}</p>}{selectedAgentId && <small className="skill-selection-note">{t("skills.selectedAgent", { name: agents.find((agent) => agent.id === selectedAgentId)?.name ?? t("common.unknown") })}</small>}</section>;
}
