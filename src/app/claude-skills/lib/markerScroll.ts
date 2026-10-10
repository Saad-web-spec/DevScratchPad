/**
 * White Marker auto-follow geometry. Pure helpers shared by the Monaco editor and the static preview,
 * so "keep the highlight and the line being changed in view" behaves identically in both.
 */

/** Pixel extent of a block inside a scroll container (top inclusive, bottom exclusive). */
export interface VerticalSpan {
  top: number;
  bottom: number;
}

export interface FollowViewport {
  scrollTop: number;
  height: number;
}

/** Breathing room kept between a revealed block and the viewport edge. */
export const FOLLOW_EDGE_PADDING = 24;

/**
 * Returns the 1-indexed first line that differs between two versions of the output,
 * or null when they are identical. Appended text at the end maps to the last line.
 */
export function findFirstChangedLine(previous: string, next: string): number | null {
  if (previous === next) return null;
  const prevLines = previous.split("\n");
  const nextLines = next.split("\n");
  const shared = Math.min(prevLines.length, nextLines.length);
  let i = 0;
  while (i < shared && prevLines[i] === nextLines[i]) i++;
  return Math.min(i, nextLines.length - 1) + 1;
}

const isFullyVisible = (span: VerticalSpan, view: FollowViewport, pad: number) =>
  span.top >= view.scrollTop + pad && span.bottom <= view.scrollTop + view.height - pad;

/**
 * Computes the scrollTop that brings the target into view, or null when no scroll is needed.
 * - `focus` (the line being changed) wins: it is centered only once it leaves the viewport, so typing never jitters.
 * - Otherwise the whole marked `range` is centered when it fits, or pinned near the top when it is taller than the view.
 */
export function computeFollowScrollTop(
  view: FollowViewport,
  range: VerticalSpan,
  focus: VerticalSpan | null,
  pad = FOLLOW_EDGE_PADDING
): number | null {
  const effectivePad = Math.min(pad, Math.max(0, view.height / 6));

  if (focus) {
    if (isFullyVisible(focus, view, effectivePad)) return null;
    const focusHeight = focus.bottom - focus.top;
    return Math.max(0, focus.top - (view.height - focusHeight) / 2);
  }

  const rangeHeight = range.bottom - range.top;
  const fitsInView = rangeHeight + effectivePad * 2 <= view.height;
  if (fitsInView) {
    if (isFullyVisible(range, view, effectivePad)) return null;
    return Math.max(0, range.top - (view.height - rangeHeight) / 2);
  }
  // Taller than the viewport: show the section start, unless the view already sits inside the section
  const viewInsideRange = view.scrollTop >= range.top - effectivePad && view.scrollTop + view.height <= range.bottom + effectivePad;
  if (viewInsideRange) return null;
  return Math.max(0, range.top - effectivePad);
}
