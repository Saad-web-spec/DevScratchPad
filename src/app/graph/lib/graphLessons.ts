/**
 * The experience file (`.skill-graph/<slug>/EXPERIENCE.md`) as the studio reads it: lessons the
 * reflect step wrote after earlier runs. The user pastes the file in, then bakes a lesson into its
 * step's prompt (making it permanent) or discards it, and downloads the trimmed file. Nothing here
 * leaves the browser.
 */
import { isValidNodeId, toSlug, type SkillGraph } from "./graphSkill";

export interface Lesson {
  /** The `n` of `[Ln]`; stable across runs and never reused. */
  number: number;
  /** Id of the step the lesson is for. */
  step: string;
  rule: string;
  evidence: string;
  seen: number;
  helped: number;
}

/** A pasted file larger than this is not a lessons file (the reflect step keeps at most 50 lessons). */
export const MAX_LESSONS_SOURCE = 100_000;
const MAX_PARSED_LESSONS = 200;

const LESSON_PATTERN = /^\s*-\s*\[L(\d+)\]\s+([A-Za-z][A-Za-z0-9_-]*):\s*(.+?)\s*$/;
const EVIDENCE_PATTERN = /^\s+evidence:\s*(.*?)\s*$/;
const COUNTER_PATTERN = /\s*·\s*(seen|helped)\s+(\d+)/g;

/** Reads lessons from the file. Lines that are not lessons are skipped, so a hand-edited file still loads. */
export function parseLessons(text: string): Lesson[] {
  if (text.length > MAX_LESSONS_SOURCE) return [];
  const lessons: Lesson[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length && lessons.length < MAX_PARSED_LESSONS; i += 1) {
    const match = LESSON_PATTERN.exec(lines[i]);
    if (!match) continue;
    const lesson: Lesson = { number: Number(match[1]), step: match[2], rule: match[3], evidence: "", seen: 0, helped: 0 };
    const evidence = EVIDENCE_PATTERN.exec(lines[i + 1] ?? "");
    if (evidence) {
      i += 1;
      for (const counter of evidence[1].matchAll(COUNTER_PATTERN)) lesson[counter[1] as "seen" | "helped"] = Number(counter[2]);
      lesson.evidence = evidence[1].replace(COUNTER_PATTERN, "").trim();
    }
    lessons.push(lesson);
  }
  return lessons;
}

/** Writes lessons back in the format the reflect step reads. */
export function serializeLessons(graph: SkillGraph, lessons: Lesson[]): string {
  const entries = lessons.map(
    (lesson) => `- [L${lesson.number}] ${lesson.step}: ${lesson.rule}\n  evidence: ${lesson.evidence || "-"} · seen ${lesson.seen} · helped ${lesson.helped}`
  );
  return [`# Lessons: ${toSlug(graph.name)}`, "", ...entries, ""].join("\n");
}

/** Lessons whose step is no longer a model step of the graph; the reflect step drops them on its next run. */
export function isOrphanLesson(graph: SkillGraph, lesson: Lesson): boolean {
  const node = graph.nodes.find((n) => n.id === lesson.step);
  return !node || node.type === "input" || node.type === "code" || node.type === "approval";
}

/** Heading of the list baked lessons are added to, at the end of a step's prompt. */
export const BAKED_HEADING = "Learned from earlier runs:";

/** Appends a lesson's rule to its step's prompt, under one shared heading; a rule already there is not added twice. */
export function bakeLesson(graph: SkillGraph, lesson: Lesson): SkillGraph {
  if (!isValidNodeId(lesson.step)) return graph;
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.id !== lesson.step) return node;
      const prompt = node.prompt.trimEnd();
      // `{{x}}` in a rule would read as a reference to another step's output once it is in the prompt.
      const bullet = `- ${lesson.rule.replace(/\{\{/g, "{ {").replace(/\}\}/g, "} }")}`;
      if (prompt.split(/\r?\n/).some((line) => line.trim() === bullet)) return node;
      return { ...node, prompt: prompt.includes(BAKED_HEADING) ? `${prompt}\n${bullet}` : `${prompt}\n\n${BAKED_HEADING}\n${bullet}` };
    }),
  };
}
