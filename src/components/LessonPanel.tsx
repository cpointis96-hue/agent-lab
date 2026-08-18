import { LESSONS, type Lesson } from "../content/lessons";

export function LessonPanel({ selected, onSelect }: { selected: Lesson; onSelect: (lesson: Lesson) => void }) {
  return <section className="lesson-panel"><div className="trace-heading"><span className="eyebrow">CURRICULUM</span><span>UI only</span></div><div className="lesson-list">{LESSONS.map((lesson, index) => <button className={lesson.id === selected.id ? "selected" : ""} key={lesson.id} onClick={() => onSelect(lesson)}><span>{index + 1}</span><strong>{lesson.title}</strong></button>)}</div><div className="lesson-detail"><span className="eyebrow">LESSON {LESSONS.indexOf(selected) + 1}</span><h3>{selected.title}</h3><p>{selected.summary}</p><small>{selected.exercise} Examples are previews only; use remains explicit.</small></div></section>;
}
