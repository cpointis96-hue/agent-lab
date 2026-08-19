import { LESSONS, type Lesson } from "../content/lessons";
import { lessonContent } from "../i18n/catalog";
import { useLanguage } from "../i18n/language";

export function LessonPanel({ selected, onSelect }: { selected: Lesson; onSelect: (lesson: Lesson) => void }) {
  const { resolvedLocale, t } = useLanguage();
  const localize = (lesson: Lesson) => lessonContent[resolvedLocale][lesson.id as keyof typeof lessonContent.en] ?? [lesson.title, lesson.summary];
  const selectedContent = localize(selected);
  return <section className="lesson-panel"><div className="trace-heading"><span className="eyebrow">{t("lesson.curriculum")}</span><span>{t("lesson.uiOnly")}</span></div><div className="lesson-list">{LESSONS.map((lesson, index) => <button className={lesson.id === selected.id ? "selected" : ""} key={lesson.id} onClick={() => onSelect(lesson)}><span>{index + 1}</span><strong>{localize(lesson)[0]}</strong></button>)}</div><div className="lesson-detail"><span className="eyebrow">{t("lesson.curriculum")} {LESSONS.indexOf(selected) + 1}</span><h3>{selectedContent[0]}</h3><p>{selectedContent[1]}</p><small>{t("lesson.previewNote", { exercise: t("lesson.exerciseLabel") })}</small></div></section>;
}
