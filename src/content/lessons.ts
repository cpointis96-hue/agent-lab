export type Lesson = { id: string; title: string; summary: string; exercise: string };

export const LESSONS: Lesson[] = [
  ["single", "Single agent", "Give one agent one stable responsibility."], ["tools", "Tools", "Separate a capability from an agent identity."], ["task", "Task", "Keep one-off work out of durable instructions."], ["second", "Second agent", "Split two responsibilities clearly."], ["handoff", "Handoff", "Define what crosses a relation."], ["review", "Review", "Add review only where it adds value."], ["memory", "Memory", "Keep durable facts separate from temporary context."], ["reset", "Reset context", "Resume from files after temporary context disappears."], ["parallel", "Parallel work", "Fan out, then collect visible results."], ["manager", "Manager / Workers", "Delegate bounded responsibilities."], ["approval", "Human approval", "Pause before an explicit approval boundary."], ["simplify", "Simplification", "Remove coordination that does not earn its cost."],
].map(([id, title, summary]) => ({ id, title, summary, exercise: `Practice: ${summary}` }));

export const lessonById = (id: string) => LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
