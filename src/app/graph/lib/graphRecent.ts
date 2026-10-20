/**
 * Recent graphs: the drafts a share link, a blueprint, a blank graph or an opened file replaced in this
 * browser, so opening someone's link never costs the user their own work. Pure, so it can be tested;
 * the studio keeps the list in storage next to the draft.
 */
import { parseGraphSkill } from "./graphSkill";

export interface RecentGraph {
  /** The graph's `name:`, or "Untitled graph". */
  name: string;
  source: string;
  /** When it was replaced, in ms since the epoch. */
  savedAt: number;
}

export const MAX_RECENT_GRAPHS = 8;
/** Larger drafts are not kept: eight of them could fill the browser's storage. */
export const MAX_RECENT_SOURCE_LENGTH = 200_000;

function graphName(source: string): string {
  return parseGraphSkill(source).graph?.name.trim() || "Untitled graph";
}

/**
 * The list after `source` was replaced: newest first, at most MAX_RECENT_GRAPHS, one entry per text.
 * `skip` lists texts not worth keeping (the starter graphs as shipped), since they can be loaded again.
 */
export function rememberGraph(list: readonly RecentGraph[], source: string, savedAt: number, skip: readonly string[] = []): RecentGraph[] {
  if (source.trim() === "" || source.length > MAX_RECENT_SOURCE_LENGTH || skip.includes(source)) return [...list];
  const rest = list.filter((entry) => entry.source !== source);
  return [{ name: graphName(source), source, savedAt }, ...rest].slice(0, MAX_RECENT_GRAPHS);
}

/** Entries read back from storage, keeping only well-formed ones (storage is user-editable). */
export function readRecentGraphs(value: unknown): RecentGraph[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is RecentGraph =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as RecentGraph).source === "string" &&
        typeof (entry as RecentGraph).name === "string" &&
        typeof (entry as RecentGraph).savedAt === "number" &&
        (entry as RecentGraph).source.length <= MAX_RECENT_SOURCE_LENGTH
    )
    .slice(0, MAX_RECENT_GRAPHS);
}
