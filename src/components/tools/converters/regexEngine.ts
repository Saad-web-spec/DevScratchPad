"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Regex evaluation for the regex tester, run inside a Web Worker so a catastrophic pattern
 * such as `(a+)+$` can never freeze the page: a run that takes longer than RUN_TIMEOUT_MS is
 * terminated and reported. Falls back to the main thread when workers are unavailable.
 */

export interface RegexGroupValue {
  /** 1-based capture index. */
  index: number;
  name?: string;
  value?: string;
}

export interface RegexMatchInfo {
  index: number;
  end: number;
  match: string;
  groups: RegexGroupValue[];
}

export interface RegexRunResult {
  ok: boolean;
  error?: string;
  timedOut?: boolean;
  matches: RegexMatchInfo[];
  /** Total matches found (may exceed `matches.length` when truncated). */
  total: number;
  truncated: boolean;
  groupCount: number;
  replaced?: string;
  ms: number;
}

export interface RegexRunRequest {
  pattern: string;
  flags: string;
  text: string;
  /** When set, also computes `text.replace(regex, replacement)` with the user's own flags. */
  replacement: string | null;
}

export const MATCH_LIMIT = 1000;
const RUN_TIMEOUT_MS = 1500;

/**
 * Self-contained so it can be stringified into the worker source: no imports and no references
 * to anything outside its own body.
 */
export function evaluateRegex(pattern: string, flags: string, text: string, replacement: string | null, limit: number): RegexRunResult {
  const start = Date.now();
  const perf = typeof performance !== "undefined" ? performance : null;
  const t0 = perf ? perf.now() : start;

  function captureNames(src: string): Array<string | undefined> {
    const names: Array<string | undefined> = [];
    let inClass = false;
    for (let i = 0; i < src.length; i++) {
      const c = src.charAt(i);
      if (c === "\\") {
        i++;
        continue;
      }
      if (inClass) {
        if (c === "]") inClass = false;
        continue;
      }
      if (c === "[") {
        inClass = true;
        continue;
      }
      if (c !== "(") continue;
      if (src.charAt(i + 1) !== "?") {
        names.push(undefined);
        continue;
      }
      if (src.charAt(i + 2) === "<" && src.charAt(i + 3) !== "=" && src.charAt(i + 3) !== "!") {
        const close = src.indexOf(">", i + 3);
        names.push(close > 0 ? src.slice(i + 3, close) : undefined);
      }
    }
    return names;
  }

  const empty: RegexRunResult = { ok: true, matches: [], total: 0, truncated: false, groupCount: 0, ms: 0 };
  if (!pattern) {
    empty.replaced = replacement === null ? undefined : text;
    return empty;
  }

  const clean = flags.replace(/[^dgimsuvy]/g, "");
  let re: RegExp;
  try {
    re = new RegExp(pattern, clean.indexOf("g") >= 0 ? clean : clean + "g");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), matches: [], total: 0, truncated: false, groupCount: 0, ms: 0 };
  }

  const names = captureNames(pattern);
  const global = clean.indexOf("g") >= 0;
  const matches: RegexMatchInfo[] = [];
  let total = 0;
  let m: RegExpExecArray | null;
  let groupCount = 0;

  while ((m = re.exec(text)) !== null) {
    total++;
    if (m.length - 1 > groupCount) groupCount = m.length - 1;
    if (matches.length < limit) {
      const groups: RegexGroupValue[] = [];
      for (let g = 1; g < m.length; g++) {
        groups.push({ index: g, name: names[g - 1], value: m[g] });
      }
      matches.push({ index: m.index, end: m.index + m[0].length, match: m[0], groups: groups });
    } else {
      break;
    }
    if (!global) break;
    if (m[0].length === 0) re.lastIndex++;
  }

  let replaced: string | undefined;
  if (replacement !== null) {
    try {
      replaced = text.replace(new RegExp(pattern, clean), replacement);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), matches: matches, total: total, truncated: false, groupCount: groupCount, ms: 0 };
    }
  }

  const ms = (perf ? perf.now() : Date.now()) - t0;
  return { ok: true, matches: matches, total: total, truncated: total > matches.length, groupCount: groupCount, replaced: replaced, ms: ms };
}

const WORKER_SOURCE = `var evaluateRegex = ${evaluateRegex.toString()};
self.onmessage = function (e) {
  var d = e.data;
  self.postMessage({ id: d.id, result: evaluateRegex(d.pattern, d.flags, d.text, d.replacement, d.limit) });
};`;

interface WorkerReply {
  id: number;
  result: RegexRunResult;
}

function createWorker(): Worker | null {
  if (typeof Worker === "undefined" || typeof Blob === "undefined") return null;
  try {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    return worker;
  } catch {
    return null;
  }
}

/** Runs the latest request off the main thread and returns its result (null until the first run finishes). */
export function useRegexRun(request: RegexRunRequest): RegexRunResult | null {
  const [result, setResult] = useState<RegexRunResult | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(false);
  const seqRef = useRef(0);
  const { pattern, flags, text, replacement } = request;

  useEffect(() => {
    const id = ++seqRef.current;

    // A run is still busy (slow pattern): drop that worker so the newest input runs right away
    if (pendingRef.current && workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (!workerRef.current) workerRef.current = createWorker();
    const worker = workerRef.current;

    if (!worker) {
      const syncResult = evaluateRegex(pattern, flags, text, replacement, MATCH_LIMIT);
      const raf = requestAnimationFrame(() => setResult(syncResult));
      return () => cancelAnimationFrame(raf);
    }

    pendingRef.current = true;
    const onMessage = (e: MessageEvent<WorkerReply>) => {
      if (e.data.id !== id) return;
      pendingRef.current = false;
      clearTimeout(timer);
      setResult(e.data.result);
    };
    const timer = setTimeout(() => {
      if (seqRef.current !== id) return;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      pendingRef.current = false;
      setResult({
        ok: false,
        timedOut: true,
        error: `Stopped after ${RUN_TIMEOUT_MS / 1000}s: the pattern backtracks too much on this text (catastrophic backtracking).`,
        matches: [],
        total: 0,
        truncated: false,
        groupCount: 0,
        ms: RUN_TIMEOUT_MS,
      });
    }, RUN_TIMEOUT_MS);

    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, pattern, flags, text, replacement, limit: MATCH_LIMIT });
    return () => {
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
    };
  }, [pattern, flags, text, replacement]);

  // Dispose the worker with the tool
  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  return result;
}
