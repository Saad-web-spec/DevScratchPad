"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash2, AlertCircle, Info } from "lucide-react";
import { ShareMenu } from "@/components/ShareMenu";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, btnGhost, selectBase, chipBtn, captionText, iconProps, ICON_STROKE } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import {
  PREFIX_CHIPS,
  formatBigInt,
  parseCidrInput,
  prefixMask,
  splitSubnets,
  toBits,
  type CidrInfo,
} from "@/components/tools/generators/cidrMath";
import { CopyIconButton, CopyTextButton, ResultRow, useCopyState } from "@/components/tools/generators/CopyControls";

interface CidrCalculatorToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

/** Rows rendered for a subnet split; the exact total is shown alongside. */
const SUBNET_CAP = 256;

/** Plain-string summary used for sharing, snapshots and the image export (bigint can't be JSON-encoded). */
function summarize(info: CidrInfo): Record<string, string> {
  const base: Record<string, string> = {
    cidr: `${info.network}/${info.prefix}`,
    network: info.network,
    [info.version === 4 ? "broadcast" : "lastAddress"]: info.last,
    firstUsable: info.firstUsable,
    lastUsable: info.lastUsable,
    usableHosts: info.usableHosts.toString(),
    totalAddresses: info.totalAddresses.toString(),
    mask: info.mask,
    wildcard: info.wildcard,
    type: info.addressType,
  };
  return base;
}

export function CidrCalculatorTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: CidrCalculatorToolProps) {
  const [input, setInput] = useState<string>(() => restoredInput || "192.168.1.0/24");
  const [splitDelta, setSplitDelta] = useState<number>(2);
  const { copiedKey, copy } = useCopyState();

  // Restore from history
  const [prevRestored, setPrevRestored] = useState(restoredInput);
  if (restoredInput !== prevRestored) {
    setPrevRestored(restoredInput);
    if (restoredInput) setInput(restoredInput);
  }

  const result = useMemo(() => (input.trim() ? parseCidrInput(input) : null), [input]);
  const info = result?.ok ? result.info : null;
  const error = result && !result.ok ? result.error : null;
  const summary = useMemo(() => (info ? summarize(info) : null), [info]);

  useEffect(() => {
    const start = performance.now();
    if (!result) onValidationChange(true);
    else if (result.ok) onValidationChange(true);
    else onValidationChange(false, result.error);
    onStatsChange(input.length, performance.now() - start);
  }, [input, result, onValidationChange, onStatsChange]);

  // Dispatch workspace state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input, output: summary ? JSON.stringify(summary) : "" },
        })
      );
    }
  }, [input, summary]);

  useEffect(() => {
    const handleSave = () => addSnapshot("cidr-calculator", "CIDR Calculator", input, summary ? JSON.stringify(summary, null, 2) : "");
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, summary]);

  const version = info?.version ?? (input.includes(":") ? 6 : 4);
  const currentPrefix = /\/\s*(\d{1,3})\s*$/.exec(input)?.[1];

  const setPrefix = (prefix: number) => {
    const ipPart = input.trim().split(/[\s/]/)[0];
    const next = `${ipPart || (version === 6 ? "2001:db8::" : "192.168.1.0")}/${prefix}`;
    setInput(next);
    onLogHistory?.(next);
  };

  const rows = useMemo(() => {
    if (!info) return [];
    const cidr = `${info.network}/${info.prefix}`;
    const hostBits = info.bits - info.prefix;
    const list: { key: string; label: string; value: string; hint?: string; mono?: boolean }[] = [
      { key: "cidr", label: "Network", value: cidr },
    ];
    if (info.version === 4) {
      list.push({ key: "broadcast", label: "Broadcast", value: info.last });
    } else {
      list.push({ key: "last", label: "Last address", value: info.last });
    }
    list.push(
      {
        key: "range",
        label: "Usable range",
        value: info.firstUsable === info.lastUsable ? info.firstUsable : `${info.firstUsable} – ${info.lastUsable}`,
      },
      { key: "hosts", label: "Usable hosts", value: formatBigInt(info.usableHosts), hint: info.hostNote },
      { key: "total", label: "Total addresses", value: formatBigInt(info.totalAddresses), hint: `2^${hostBits}` },
      { key: "mask", label: info.version === 4 ? "Subnet mask" : "Prefix mask", value: info.mask },
      { key: "wildcard", label: info.version === 4 ? "Wildcard mask" : "Host mask", value: info.wildcard },
      { key: "type", label: "Address type", value: info.addressType, mono: false }
    );
    if (info.version === 4) {
      list.push(
        { key: "class", label: "Class (legacy)", value: info.ipClass ?? "", mono: false },
        {
          key: "int",
          label: "Address as integer",
          value: info.addressValue.toString(),
          hint: `0x${info.addressValue.toString(16).toUpperCase().padStart(8, "0")}`,
        }
      );
    } else if (info.expanded) {
      list.push({ key: "expanded", label: "Expanded address", value: info.expanded });
    }
    list.push({ key: "ptr", label: "Reverse DNS", value: info.reverseDns });
    return list;
  }, [info]);

  const imageCode = summary ? JSON.stringify(summary, null, 2) : input;

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto w-full overflow-x-hidden relative">
      {/* Tool Header */}
      <ToolHeader
        icon={getToolIcon("cidr-calculator")}
        title="CIDR Calculator"
        className="sticky top-0 z-10"
        utilities={<ShareMenu toolSlug="cidr-calculator" data={input} imageCode={imageCode} imageLanguage="json" />}
      />

      <div className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 md:px-6 md:py-6 flex-1 flex flex-col gap-5 md:gap-6">
        {/* CIDR Input & Quick Preset Strip */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="cidr-input" className={captionText}>
                CIDR block
              </label>
              {info && (
                <span className="rounded border border-zinc-200 px-1.5 py-px font-mono text-[11px] font-medium text-zinc-600">IPv{info.version}</span>
              )}
            </div>
            <div className="-mr-2 flex items-center">
              <CopyTextButton copied={copiedKey === "input"} onCopy={() => void copy(input.trim(), "input")} disabled={!input.trim()} />
              <button type="button" onClick={() => setInput("")} disabled={!input} className={btnGhost} title="Clear input">
                <Trash2 {...iconProps} />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <input
            id="cidr-input"
            type="text"
            value={input}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => setInput(e.target.value)}
            placeholder="192.168.1.0/24, 10.0.0.1 255.255.0.0 or 2001:db8::/32"
            aria-invalid={Boolean(error)}
            aria-describedby="cidr-status"
            className={cn(
              "w-full h-12 font-mono text-base md:text-lg font-medium bg-white border rounded-lg px-3 md:px-4 text-zinc-900 transition-colors focus:ring-1 focus:outline-none placeholder:text-zinc-400 placeholder:font-normal",
              error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
            )}
          />
          <div id="cidr-status" className="min-h-5 text-xs">
            {error ? (
              <p className="flex items-start gap-1.5 text-red-600">
                <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                {error}
              </p>
            ) : info?.prefixAssumed ? (
              <p className="flex items-start gap-1.5 text-zinc-500">
                <Info className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                No prefix given, so this is a single host (/{info.bits}).
              </p>
            ) : info?.isHostAddress ? (
              <p className="flex items-start gap-1.5 text-zinc-500">
                <Info className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span className="break-all">
                  <span className="font-mono text-zinc-700">{info.address}</span> is a host inside{" "}
                  <span className="font-mono text-zinc-700">{info.network}/{info.prefix}</span>.
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Prefix length">
            {PREFIX_CHIPS[version].map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={currentPrefix === String(p)}
                onClick={() => setPrefix(p)}
                className={cn(chipBtn(currentPrefix === String(p)), "min-w-12 px-2 font-mono md:h-7 md:min-w-10 md:text-[11px]")}
              >
                /{p}
              </button>
            ))}
          </div>
        </div>

        {info ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">
            {/* Metrics */}
            <section className="border border-zinc-200 rounded-lg overflow-hidden" aria-label="Network details">
              <PaneBar label="Network details">
                <CopyTextButton
                  copied={copiedKey === "summary"}
                  onCopy={() => void copy(rows.map((r) => `${r.label}: ${r.value}`).join("\n"), "summary")}
                >
                  Copy all
                </CopyTextButton>
              </PaneBar>
              <div className="divide-y divide-zinc-100">
                {rows.map((row) => (
                  <ResultRow
                    key={row.key}
                    label={row.label}
                    value={row.value}
                    hint={row.hint}
                    mono={row.mono !== false}
                    copied={copiedKey === row.key}
                    onCopy={() => void copy(row.key === "range" ? row.value.replace(" – ", "-") : row.value, row.key)}
                  />
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-5 md:gap-6 min-w-0">
              <BinaryView info={info} />
              <SubnetSplitter info={info} delta={splitDelta} onDeltaChange={setSplitDelta} />
            </div>
          </div>
        ) : (
          <div className="text-center px-4 py-16 text-zinc-400 text-sm border-y border-zinc-200">
            Enter an IPv4 or IPv6 block to see network details.
          </div>
        )}
      </div>
    </div>
  );
}

/** Bits split into network (dark) and host (light) parts. */
function BitRow({ label, value, info }: { label: string; value: bigint; info: CidrInfo }) {
  const bits = toBits(value, info.bits);
  const groupSize = info.version === 4 ? 8 : 16;
  const groups = Array.from({ length: info.bits / groupSize }, (_, i) => bits.slice(i * groupSize, (i + 1) * groupSize));
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-16 shrink-0 text-xs font-medium text-zinc-500">{label}</span>
      <span className={cn("font-mono text-[13px] leading-6", info.version === 6 && "grid grid-cols-1 sm:grid-cols-2 sm:gap-x-4")}>
        {groups.map((g, i) => {
          const start = i * groupSize;
          const netCount = Math.max(0, Math.min(groupSize, info.prefix - start));
          return (
            <span key={i} className="whitespace-nowrap">
              {info.version === 6 && (
                <span className="mr-2 inline-block w-9 text-zinc-500">{parseInt(g, 2).toString(16).padStart(4, "0")}</span>
              )}
              <span className="font-semibold text-zinc-900">{g.slice(0, netCount)}</span>
              <span className="text-zinc-400">{g.slice(netCount)}</span>
              {info.version === 4 && i < groups.length - 1 && <span className="text-zinc-300">.</span>}
            </span>
          );
        })}
      </span>
    </div>
  );
}

function BinaryView({ info }: { info: CidrInfo }) {
  const maskValue = prefixMask(info.prefix, info.bits);
  return (
    <section className="border border-zinc-200 rounded-lg overflow-hidden" aria-label="Binary view">
      <PaneBar label="Binary">
        <span className="flex items-center gap-3 pr-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-zinc-900" aria-hidden="true" />
            Network
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-zinc-400" aria-hidden="true" />
            Host
          </span>
        </span>
      </PaneBar>
      <div className="flex flex-col gap-2 overflow-x-auto px-3 py-3 md:px-4">
        <BitRow label="Address" value={info.addressValue} info={info} />
        {info.version === 4 && <BitRow label="Mask" value={maskValue} info={info} />}
        {info.version === 4 && info.isHostAddress && <BitRow label="Network" value={info.networkValue} info={info} />}
      </div>
    </section>
  );
}

function SubnetSplitter({ info, delta, onDeltaChange }: { info: CidrInfo; delta: number; onDeltaChange: (d: number) => void }) {
  const { copiedKey, copy } = useCopyState();
  const maxDelta = Math.min(16, info.bits - info.prefix);
  const effectiveDelta = Math.min(delta, maxDelta);
  const newPrefix = info.prefix + effectiveDelta;
  const { rows, total } = useMemo(() => splitSubnets(info, newPrefix, SUBNET_CAP), [info, newPrefix]);

  if (maxDelta < 1) return null;

  return (
    <section className="border border-zinc-200 rounded-lg overflow-hidden" aria-label="Subnets">
      <PaneBar label={<>Split into <span className="normal-case tracking-normal text-zinc-400">· {formatBigInt(total)} subnets</span></>}>
        <select
          value={effectiveDelta}
          onChange={(e) => onDeltaChange(Number(e.target.value))}
          className={cn(selectBase, "border-transparent bg-transparent font-mono")}
          aria-label="Subnet prefix"
        >
          {Array.from({ length: maxDelta }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              /{info.prefix + d}
            </option>
          ))}
        </select>
        <CopyTextButton
          copied={copiedKey === "all"}
          onCopy={() => void copy(rows.map((r) => r.cidr).join("\n"), "all")}
          title={total > BigInt(SUBNET_CAP) ? `Copies the first ${SUBNET_CAP}` : "Copy every subnet"}
        >
          <span className="hidden sm:inline">Copy list</span>
          <span className="sm:hidden">List</span>
        </CopyTextButton>
      </PaneBar>
      <ol className="max-h-80 divide-y divide-zinc-100 overflow-y-auto">
        {rows.map((r, i) => (
          <li key={r.cidr} className="flex items-center gap-2 py-0.5 pl-3 pr-1 md:pl-4">
            <span className="w-7 shrink-0 text-right font-mono text-[11px] tabular-nums text-zinc-400 select-none">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block break-all font-mono text-[13px] text-zinc-900">{r.cidr}</span>
              <span className="block break-all font-mono text-[11px] text-zinc-500">
                {r.first} – {r.last}
              </span>
            </span>
            <CopyIconButton copied={copiedKey === `s-${i}`} onCopy={() => void copy(r.cidr, `s-${i}`)} label={`subnet ${r.cidr}`} />
          </li>
        ))}
      </ol>
      {total > BigInt(rows.length) && (
        <p className="border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500">
          Showing the first {rows.length} of {formatBigInt(total)}.
        </p>
      )}
    </section>
  );
}
