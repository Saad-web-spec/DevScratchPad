"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, CircleDot, Cpu, ListChecks, Lock, Merge, Minus, Plus, Redo2, Scan, ShieldCheck, Split, SquareTerminal, Undo2, UserCheck, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_THEME } from "./theme";
import { LAYOUT_GAPS, NODE_HEIGHT, NODE_WIDTH, layoutGraph, type GraphLayout, type GraphNode, type IsolationReport, type NodeLayout, type NodeType, type SkillGraph } from "../lib/graphSkill";

export type Selection = { kind: "node"; id: string } | { kind: "edge"; id: string } | null;

export function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

/** Plan walkthrough state: the stage being shown and the stages before it. */
export interface Trace {
  active: Set<string>;
  done: Set<string>;
}

const TYPE_ICON: Record<NodeType, LucideIcon> = {
  input: CircleDot,
  orchestrator: Split,
  worker: Cpu,
  verifier: ShieldCheck,
  synthesizer: Merge,
  agent: Bot,
  code: SquareTerminal,
  approval: UserCheck,
};

interface View {
  x: number;
  y: number;
  k: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const FIT_PADDING = 40;
const LABEL_MIN_ZOOM = 0.5;
/** Width of one character in the 10px mono pill text, plus the pill's side padding and a margin to each card. */
const PILL_CHAR_WIDTH = 6.1;
const PILL_PADDING = 16;
const PILL_MARGIN = 10;

/** Longest contract name a pill shows in full; longer names are shortened (the full name is in its tooltip and the inspector). */
function pillMaxChars(layout: GraphLayout): number {
  // LR pills sit between two columns; TB pills sit between two rows and are only limited by their siblings.
  const room = layout.direction === "LR" ? LAYOUT_GAPS.LR.layer - PILL_PADDING - PILL_MARGIN * 2 : NODE_WIDTH - PILL_PADDING;
  return Math.max(6, Math.floor(room / PILL_CHAR_WIDTH));
}

/** Where edges leave a node (out) and arrive (in): right/left for LR, bottom/top for TB. */
function anchor(position: NodeLayout, layout: GraphLayout, side: "out" | "in"): { x: number; y: number } {
  if (layout.direction === "TB") return { x: position.x + NODE_WIDTH / 2, y: side === "out" ? position.y + NODE_HEIGHT : position.y };
  return { x: side === "out" ? position.x + NODE_WIDTH : position.x, y: position.y + NODE_HEIGHT / 2 };
}

interface GraphCanvasProps {
  graph: SkillGraph;
  /** Plan walkthrough; null when not stepping through the plan. */
  trace: Trace | null;
  isolation: Map<string, IsolationReport>;
  selection: Selection;
  /** Bumped when a node is selected from outside the canvas (the editor), so the canvas brings it into view. */
  focusRequest: { id: string; nonce: number } | null;
  /** Bumped when the whole document is replaced, so the canvas re-frames the new graph. */
  fitRequest: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSelect: (selection: Selection) => void;
  onConnect: (from: string, to: string) => void;
  onDeleteSelection: () => void;
}

/** The "prior context bias" meter on nodes that declare isolated_context; hangs off the card's top edge. */
function IsolationBadge({ report }: { report: IsolationReport }) {
  const clean = report.biasPercent === 0;
  return (
    <span
      title="Share of this node's upstream references that bypass its incoming edges. 0% means its subagent sees only what its edges carry."
      className={cn(
        "absolute -top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-bold leading-none shadow-sm",
        clean ? "border border-orange-200 bg-orange-50 text-orange-800" : "border border-rose-300 bg-rose-50 text-rose-700"
      )}
    >
      <Lock className={cn("h-2.5 w-2.5", clean && "text-orange-600")} />
      {report.biasPercent}% prior-context bias
    </span>
  );
}

/** Blast radius chip; sits in the card's top row so the footer keeps its room for the id. */
function RiskChip({ node }: { node: GraphNode }) {
  if (!node.risk || node.risk === "contained") return null;
  return (
    <span
      title={node.risk === "irreversible" ? "Hard to undo: runs only after an approval" : "Wide blast radius: needs a command check"}
      className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none", node.risk === "irreversible" ? "bg-orange-50 text-orange-700" : "bg-zinc-100 text-zinc-600")}
    >
      {node.risk}
    </span>
  );
}

/** Bottom line of a node card: the id, the model tier, how many tools the node's agent gets and its check. */
function NodeFooter({ node }: { node: GraphNode }) {
  const name = node.type === "code" && node.run ? `$ ${node.run}` : node.id;
  return (
    <span className="flex min-w-0 shrink-0 items-center gap-1.5 text-[10px] leading-none text-zinc-400">
      <span className="min-w-0 truncate font-mono leading-tight" title={name}>
        {name}
      </span>
      {node.check && (
        <span className="flex shrink-0 items-center" title={`Check: ${node.check}`}>
          <ListChecks className="h-2.5 w-2.5" />
        </span>
      )}
      {node.model && <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-semibold leading-none text-zinc-600">{node.model}</span>}
      {node.tools && node.tools.length > 0 && (
        <span className="flex shrink-0 items-center gap-0.5" title={node.tools.join(", ")}>
          <Wrench className="h-2.5 w-2.5" />
          {node.tools.length}
        </span>
      )}
    </span>
  );
}

const TOOL_BUTTON = "p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-35";

export function GraphCanvas({
  graph,
  trace,
  isolation,
  selection,
  focusRequest,
  fitRequest,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSelect,
  onConnect,
  onDeleteSelection,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  const autoFit = useRef(true);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ from: string; x: number; y: number } | null>(null);

  // Portrait canvases (phones, narrow windows) read better top to bottom.
  const direction = size.height > size.width * 1.1 ? "TB" : "LR";
  const layout = useMemo(() => layoutGraph(graph, direction), [graph, direction]);

  useLayoutEffect(() => {
    viewRef.current = view;
  }, [view]);

  const fitTo = useCallback(
    (width: number, height: number) => {
      if (width === 0 || height === 0) return;
      const k = Math.min(1, Math.max(MIN_ZOOM, Math.min((width - FIT_PADDING * 2) / layout.width, (height - FIT_PADDING * 2) / layout.height)));
      setView({ k, x: (width - layout.width * k) / 2, y: (height - layout.height * k) / 2 });
    },
    [layout.width, layout.height]
  );

  // Track the container size; keep the whole graph in view until the user pans or zooms themselves.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A new document (blueprint, opened file) is framed afresh, even after the user panned the last one.
  const fitSeen = useRef(fitRequest);
  useEffect(() => {
    if (fitSeen.current !== fitRequest) {
      fitSeen.current = fitRequest;
      autoFit.current = true;
    }
    if (autoFit.current) fitTo(size.width, size.height);
  }, [size, fitTo, fitRequest]);

  // A node picked in the editor is panned into view if it is off screen.
  useEffect(() => {
    if (!focusRequest) return;
    const position = layout.positions.get(focusRequest.id);
    if (!position || size.width === 0) return;
    const { x, y, k } = viewRef.current;
    const left = position.x * k + x;
    const top = position.y * k + y;
    const visible = left >= 0 && top >= 0 && left + NODE_WIDTH * k <= size.width && top + NODE_HEIGHT * k <= size.height;
    if (visible) return;
    autoFit.current = false;
    setView({ k, x: size.width / 2 - (position.x + NODE_WIDTH / 2) * k, y: size.height / 2 - (position.y + NODE_HEIGHT / 2) * k });
  }, [focusRequest, layout.positions, size.width, size.height]);

  const zoomAround = useCallback((factor: number, cx: number, cy: number) => {
    autoFit.current = false;
    setView((current) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.k * factor));
      const ratio = k / current.k;
      return { k, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio };
    });
  }, []);

  // Wheel zoom needs a non-passive listener so the page does not scroll underneath.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      zoomAround(Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015)), event.clientX - rect.left, event.clientY - rect.top);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [zoomAround]);

  /* ---------------------------------------------------------------- pan (one pointer) and pinch (two touches) */

  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; view: View; midX: number; midY: number } | null>(null);

  const localPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: clientX, y: clientY };
  };

  const startPinchIfReady = () => {
    if (touches.current.size !== 2) return;
    const [a, b] = [...touches.current.values()];
    dragRef.current = null;
    pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, view: viewRef.current, midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
  };

  const onTouchPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    touches.current.set(event.pointerId, localPoint(event.clientX, event.clientY));
    startPinchIfReady();
  };

  const onTouchPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || !touches.current.has(event.pointerId)) return;
    touches.current.set(event.pointerId, localPoint(event.clientX, event.clientY));
    const pinch = pinchRef.current;
    if (!pinch || touches.current.size !== 2) return;
    const [a, b] = [...touches.current.values()];
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.view.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance)));
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    // Keep the world point that started under the fingers' midpoint under the current midpoint.
    const worldX = (pinch.midX - pinch.view.x) / pinch.view.k;
    const worldY = (pinch.midY - pinch.view.y) / pinch.view.k;
    autoFit.current = false;
    setView({ k, x: midX - worldX * k, y: midY - worldY * k });
  };

  const onTouchPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinchRef.current = null;
  };

  const onBackgroundPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || pinchRef.current) return;
    containerRef.current?.focus();
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onBackgroundPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || pinchRef.current) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    autoFit.current = false;
    setView((current) => ({ ...current, x: drag.originX + dx, y: drag.originY + dy }));
  };

  const onBackgroundPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag && !drag.moved) onSelect(null);
  };

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const current = viewRef.current;
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - current.x) / current.k, y: (clientY - rect.top - current.y) / current.k };
  }, []);

  // Dragging from an output handle draws a line that snaps onto the node under the pointer.
  useEffect(() => {
    if (!connecting) return;
    const from = connecting.from;
    const onMove = (event: PointerEvent) => setConnecting({ from, ...toWorld(event.clientX, event.clientY) });
    const onUp = (event: PointerEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-node-id]");
      const to = target?.dataset.nodeId;
      if (to && to !== from) onConnect(from, to);
      setConnecting(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [connecting, onConnect, toWorld]);

  const edges = useMemo(() => {
    const drawn = new Set<string>();
    return graph.edges.flatMap((edge) => {
      const a = layout.positions.get(edge.from);
      const b = layout.positions.get(edge.to);
      // A repeated edge in the file is drawn once; both copies would share one key and one path.
      if (!a || !b || drawn.has(edgeKey(edge.from, edge.to))) return [];
      drawn.add(edgeKey(edge.from, edge.to));
      const start = anchor(a, layout, "out");
      const end = anchor(b, layout, "in");
      const { x: x1, y: y1 } = start;
      const { x: x2, y: y2 } = end;
      const tb = layout.direction === "TB";
      // An edge that skips layers runs straight through the lane it was given in each column between its ends.
      const lanes = (layout.routes.get(edgeKey(edge.from, edge.to)) ?? []).flatMap((p) =>
        tb ? [{ x: p.x, y: p.y - NODE_HEIGHT / 2 }, { x: p.x, y: p.y + NODE_HEIGHT / 2 }] : [{ x: p.x - NODE_WIDTH / 2, y: p.y }, { x: p.x + NODE_WIDTH / 2, y: p.y }]
      );
      const points = [start, ...lanes, end];
      const curve = (p: { x: number; y: number }, q: { x: number; y: number }) =>
        tb
          ? `C ${p.x} ${p.y + Math.max(30, (q.y - p.y) / 2)}, ${q.x} ${q.y - Math.max(30, (q.y - p.y) / 2)}, ${q.x} ${q.y}`
          : `C ${p.x + Math.max(40, (q.x - p.x) / 2)} ${p.y}, ${q.x - Math.max(40, (q.x - p.x) / 2)} ${q.y}, ${q.x} ${q.y}`;
      // Curves cross the gaps between layers; even segments are gaps, odd ones are lanes inside a column.
      const d = `M ${x1} ${y1} ${points
        .slice(1)
        .map((q, index) => (index % 2 === 0 ? curve(points[index], q) : `L ${q.x} ${q.y}`))
        .join(" ")}`;
      const middle = (points.length - 1) / 2;
      const [m1, m2] = [points[Math.floor(middle)], points[Math.ceil(middle)]];
      const mx = (m1.x + m2.x) / 2;
      const my = (m1.y + m2.y) / 2;
      // One contract pill per fan-out (in the gap after the source) or fan-in (in the gap before the target);
      // a lone edge gets its pill at its middle. Pills sit in the gap between layers, so cards never cover them.
      const siblings = (pick: (e: typeof edge) => boolean) => graph.edges.filter((e) => e.contract === edge.contract && pick(e));
      const fanOut = siblings((e) => e.from === edge.from);
      const fanIn = siblings((e) => e.to === edge.to);
      const half = LAYOUT_GAPS[layout.direction].layer / 2;
      let label: { x: number; y: number } | null = null;
      if (edge.contract) {
        if (fanOut.length > 1) label = fanOut[0] === edge ? (tb ? { x: x1, y: y1 + half } : { x: x1 + half, y: y1 }) : null;
        else if (fanIn.length > 1) label = fanIn[0] === edge ? (tb ? { x: x2, y: y2 - half } : { x: x2 - half, y: y2 }) : null;
        // A lane is narrower than a pill, so a long edge's pill goes in the gap after its source.
        else label = lanes.length > 0 ? { x: (x1 + lanes[0].x) / 2, y: (y1 + lanes[0].y) / 2 } : { x: mx, y: my };
      }
      return [{ edge, key: edgeKey(edge.from, edge.to), d, mx, my, label }];
    });
  }, [graph.edges, layout]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget && (event.target as HTMLElement).dataset.nodeId === undefined) return;
    const mod = event.ctrlKey || event.metaKey;
    if ((event.key === "Delete" || event.key === "Backspace") && selection) {
      event.preventDefault();
      onDeleteSelection();
    } else if (event.key === "Escape") {
      onSelect(null);
    } else if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) onRedo();
      else onUndo();
    } else if (mod && event.key.toLowerCase() === "y") {
      event.preventDefault();
      onRedo();
    }
  };

  const selectedKey = selection?.kind === "edge" ? selection.id : null;
  const showLabels = view.k >= LABEL_MIN_ZOOM;
  const connectPosition = connecting ? layout.positions.get(connecting.from) : undefined;
  const connectFrom = connectPosition ? anchor(connectPosition, layout, "out") : undefined;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="application"
      aria-label="Skill graph canvas. Drag to pan, scroll or pinch to zoom, Delete removes the selected node or edge."
      onKeyDown={onKeyDown}
      onPointerDownCapture={onTouchPointerDown}
      onPointerMoveCapture={onTouchPointerMove}
      onPointerUpCapture={onTouchPointerEnd}
      onPointerCancelCapture={onTouchPointerEnd}
      className="graph-canvas-grid relative h-full w-full touch-none overflow-hidden outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500/40"
    >
      <div
        className={cn("absolute inset-0", connecting ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing")}
        onPointerDown={onBackgroundPointerDown}
        onPointerMove={onBackgroundPointerMove}
        onPointerUp={onBackgroundPointerUp}
      />

      <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <svg width={layout.width} height={layout.height} className="absolute left-0 top-0 overflow-visible">
          {edges.map(({ edge, key, d, mx, my }) => {
            const selected = selectedKey === key;
            const hovered = hoverEdge === key;
            const carrying = trace !== null && trace.active.has(edge.to) && trace.done.has(edge.from);
            const delivered = trace !== null && trace.done.has(edge.to);
            return (
              <g key={key}>
                <path
                  d={d}
                  fill="none"
                  strokeWidth={selected || hovered || carrying ? 2.25 : 1.6}
                  className={cn(
                    selected || hovered ? "stroke-orange-500" : delivered ? "stroke-zinc-500" : "stroke-zinc-300",
                    carrying && "graph-edge-flow stroke-orange-500"
                  )}
                />
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  className="cursor-pointer [pointer-events:stroke]"
                  onPointerEnter={() => setHoverEdge(key)}
                  onPointerLeave={() => setHoverEdge((current) => (current === key ? null : current))}
                  onClick={() => onSelect({ kind: "edge", id: key })}
                />
                <circle
                  cx={mx}
                  cy={my}
                  r={selected || hovered ? 5 : 3.5}
                  className={cn("pointer-events-none", selected || hovered ? "fill-orange-500" : delivered ? "fill-zinc-500" : "fill-zinc-300")}
                />
              </g>
            );
          })}
          {edges.map(({ edge, key, label }) => {
            if (!label || !edge.contract || !(showLabels || selectedKey === key || hoverEdge === key)) return null;
            const maxChars = pillMaxChars(layout);
            const text = edge.contract.length > maxChars ? `${edge.contract.slice(0, maxChars - 1)}…` : edge.contract;
            const width = Math.ceil(text.length * PILL_CHAR_WIDTH) + PILL_PADDING;
            return (
              <g key={`pill-${key}`} className="pointer-events-none">
                <title>{edge.contract}</title>
                <rect x={label.x - width / 2} y={label.y - 9} width={width} height={18} rx={9} className={selectedKey === key ? "fill-orange-50 stroke-orange-300" : "fill-white stroke-zinc-200"} strokeWidth={1} />
                <text x={label.x} y={label.y + 3.5} textAnchor="middle" className={cn("font-mono text-[10px] font-medium", selectedKey === key ? "fill-orange-700" : "fill-zinc-500")}>
                  {text}
                </text>
              </g>
            );
          })}
          {connecting && connectFrom && (
            <path d={`M ${connectFrom.x} ${connectFrom.y} L ${connecting.x} ${connecting.y}`} fill="none" strokeWidth={1.5} className="stroke-orange-500 [stroke-dasharray:4_4]" />
          )}
        </svg>

        {graph.nodes.map((node) => {
          const position = layout.positions.get(node.id);
          if (!position) return null;
          const report = isolation.get(node.id);
          const selected = selection?.kind === "node" && selection.id === node.id;
          const running = trace?.active.has(node.id) ?? false;
          const finished = trace?.done.has(node.id) ?? false;
          const dimmed = trace !== null && !running && !finished;
          const Icon = TYPE_ICON[node.type];
          const theme = NODE_THEME[node.type];
          return (
            <div
              key={node.id}
              data-node-id={node.id}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}, ${node.type} node${running ? ", current stage" : finished ? ", done" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect({ kind: "node", id: node.id })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect({ kind: "node", id: node.id });
                }
              }}
              style={{ left: position.x, top: position.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
              className={cn(
                "group pointer-events-auto absolute flex cursor-pointer items-start gap-2.5 overflow-visible rounded-xl border bg-white px-3 py-2.5 text-left shadow-xs outline-hidden transition-[border-color,box-shadow,opacity]",
                selected ? "border-orange-500 ring-4 ring-orange-500/15" : "border-zinc-200 hover:border-zinc-300",
                running && "border-orange-500 ring-4 ring-orange-400/20",
                dimmed && "opacity-50",
                "focus-visible:ring-4 focus-visible:ring-orange-500/25"
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors", running ? "bg-orange-500 text-white" : theme.tile)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex h-full min-w-0 flex-1 flex-col justify-between">
                <span className="flex shrink-0 items-center justify-between gap-2 leading-none">
                  <span className={cn("truncate text-[10px] font-bold uppercase leading-none tracking-[0.08em]", theme.label)}>{node.type}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5">
                    <RiskChip node={node} />
                  {running &&<span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-orange-500" aria-hidden />}
                  {finished && (node.type === "verifier" ? <ShieldCheck className="h-3.5 w-3.5 text-zinc-900" /> : <Check className="h-3.5 w-3.5 text-zinc-900" />)}
                  </span>
                </span>
                <span className="line-clamp-2 shrink-0 text-[12.5px] font-bold leading-[1.25] tracking-[-0.01em] text-zinc-900" title={node.label}>
                  {node.label}
                </span>
                <NodeFooter node={node} />
              </span>
              {node.isolatedContext && report && <IsolationBadge report={report} />}

              <button
                type="button"
                tabIndex={-1}
                aria-label={`Connect ${node.id} to another node`}
                title="Drag to another node to connect"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  setConnecting({ from: node.id, ...toWorld(event.clientX, event.clientY) });
                }}
                className={cn(
                  // A small dot that comes forward on hover; the ::before area makes it easy to grab.
                  "absolute h-2.5 w-2.5 cursor-crosshair rounded-full border border-zinc-300 bg-white opacity-60 transition-[opacity,transform,background-color,border-color]",
                  "before:absolute before:-inset-2.5 before:content-[''] group-hover:opacity-100 group-hover:border-zinc-500 hover:scale-150 hover:border-orange-500 hover:bg-orange-500",
                  selected && "opacity-100 border-zinc-500",
                  layout.direction === "TB" ? "-bottom-[5px] left-1/2 -translate-x-1/2" : "-right-[5px] top-1/2 -translate-y-1/2"
                )}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs">
        <button type="button" aria-label="Undo graph edit" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} className={TOOL_BUTTON}>
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Redo graph edit" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo} className={cn(TOOL_BUTTON, "border-r border-zinc-200")}>
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomAround(1 / 1.25, size.width / 2, size.height / 2)} className={TOOL_BUTTON}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-11 border-x border-zinc-200 py-1 text-center font-mono text-[10.5px] font-medium text-zinc-500">{Math.round(view.k * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => zoomAround(1.25, size.width / 2, size.height / 2)} className={TOOL_BUTTON}>
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Fit graph to view"
          title="Fit graph to view"
          onClick={() => {
            autoFit.current = true;
            fitTo(size.width, size.height);
          }}
          className={cn(TOOL_BUTTON, "border-l border-zinc-200")}
        >
          <Scan className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="pointer-events-none absolute bottom-3.5 right-3.5 hidden rounded-full bg-white/80 px-2.5 py-1 text-[11px] text-zinc-500 backdrop-blur md:block">
        Drag a node&apos;s handle onto another node to connect · Delete removes the selection
      </p>
    </div>
  );
}
