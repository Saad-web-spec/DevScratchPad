/**
 * Share card for /graph and its guide (Open Graph for LinkedIn/WhatsApp/Slack, and the X large card).
 * Rendered by next/og at build time. Deliberately minimal: brand, headline and one line on the left; on the
 * right the smallest graph that still says what the studio does (a goal fans out to two parallel workers,
 * which a fresh-context verifier checks). White, zinc and one orange accent; no dark fills.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const SHARE_SIZE = { width: 1200, height: 630 };

const ZINC_900 = "#18181b";
const ZINC_600 = "#52525b";
const ZINC_500 = "#71717a";
const ZINC_400 = "#a1a1aa";
const ZINC_200 = "#e4e4e7";
const ORANGE_50 = "#fff7ed";
const ORANGE_200 = "#fed7aa";
const ORANGE_500 = "#f97316";
const ORANGE_600 = "#ea580c";

const fontFile = (name: string) => readFile(join(process.cwd(), "src/app/graph/_og", name));

/* ---------------------------------------------------------------- the graph */

/** Left column: text. Right of PANEL_LEFT: the tinted graph panel. EDGE is the top/bottom margin. */
const TEXT_LEFT = 72;
const TEXT_WIDTH = 500;
const PANEL_LEFT = 640;
const EDGE = 60;

const NODE_W = 136;
const NODE_H = 56;
/** Three columns with 36px gaps, centred in the panel. */
const COLUMNS = [680, 852, 1024];
const MID = 315;
const SPREAD = 92;

type IconName = "input" | "worker" | "verifier";

const ICONS: Record<IconName, React.ReactNode[]> = {
  input: [<circle key="a" cx="12" cy="12" r="10" />, <circle key="b" cx="12" cy="12" r="1" />],
  worker: [
    <rect key="a" x="4" y="4" width="16" height="16" rx="2" />,
    <rect key="b" x="8" y="8" width="8" height="8" rx="1" />,
    <path key="c" d="M12 20v2M12 2v2M17 20v2M17 2v2M2 12h2M2 17h2M2 7h2M20 12h2M20 17h2M20 7h2M7 20v2M7 2v2" />,
  ],
  verifier: [
    <path key="a" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
    <path key="b" d="m9 12 2 2 4-4" />,
  ],
};

function Node({ x, cy, icon, label, accent }: { x: number; cy: number; icon: IconName; label: string; accent?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: cy - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
        borderRadius: 14,
        backgroundColor: accent ? ORANGE_50 : "white",
        border: `1.5px solid ${accent ? ORANGE_500 : ZINC_200}`,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent ? ORANGE_600 : ZINC_500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[icon]}
      </svg>
      <div style={{ display: "flex", fontSize: 17, fontWeight: 700, color: ZINC_900 }}>{label}</div>
    </div>
  );
}

function Graph() {
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} C ${x1 + 26} ${y1}, ${x2 - 26} ${y2}, ${x2} ${y2}`;
  const rows = [MID - SPREAD, MID + SPREAD];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
        {rows.map((cy) => (
          <path key={`a-${cy}`} d={curve(COLUMNS[0] + NODE_W, MID, COLUMNS[1], cy)} fill="none" stroke={ZINC_400} strokeWidth="2" />
        ))}
        {rows.map((cy) => (
          <path key={`b-${cy}`} d={curve(COLUMNS[1] + NODE_W, cy, COLUMNS[2], MID)} fill="none" stroke={ORANGE_500} strokeWidth="2" strokeDasharray="6 5" />
        ))}
      </svg>
      <Node x={COLUMNS[0]} cy={MID} icon="input" label="Goal" />
      <Node x={COLUMNS[1]} cy={rows[0]} icon="worker" label="Research" />
      <Node x={COLUMNS[1]} cy={rows[1]} icon="worker" label="Review" />
      <Node x={COLUMNS[2]} cy={MID} icon="verifier" label="Verify" accent />
    </div>
  );
}

/* ---------------------------------------------------------------- brand and text */

/** The Skill Graph mark on a soft orange tile (no dark fill). */
function Mark() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: ORANGE_50, border: `1.5px solid ${ORANGE_200}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ZINC_900} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12c3.5 0 4-6 8-6" />
        <path d="M8 12c3.5 0 4 6 8 6" />
        <rect x="2" y="9" width="6" height="6" rx="1.75" fill="white" />
        <rect x="16" y="3" width="6" height="6" rx="1.75" fill="white" />
        <rect x="16" y="15" width="6" height="6" rx="1.75" fill={ORANGE_600} stroke={ORANGE_600} />
      </svg>
    </div>
  );
}

export interface ShareCardProps {
  /** Small orange line above the headline; optional. */
  eyebrow?: string;
  /** Headline lines, each kept on one line (Satori would otherwise break "multi-agent" at the hyphen). */
  title: string[];
  subtitle: string;
  /** The page's address, shown at the bottom (without the protocol). */
  url: string;
}

export async function renderShareImage({ eyebrow, title, subtitle, url }: ShareCardProps): Promise<ImageResponse> {
  const [manrope500, manrope700, manrope800] = await Promise.all([fontFile("manrope-500.woff"), fontFile("manrope-700.woff"), fontFile("manrope-800.woff")]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "white", fontFamily: "Manrope" }}>
        {/* Brand, top-left; the headline block is centred on the graph's middle row; the link sits as far from the bottom as the brand from the top. */}
        <div style={{ position: "absolute", left: TEXT_LEFT, top: EDGE, display: "flex", alignItems: "center", gap: 14 }}>
          <Mark />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: ZINC_900, letterSpacing: -0.5 }}>Skill Graph</div>
        </div>

        <div style={{ position: "absolute", left: TEXT_LEFT, top: 0, width: TEXT_WIDTH, height: 630, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {eyebrow && <div style={{ display: "flex", marginBottom: 12, fontSize: 19, fontWeight: 700, color: ORANGE_600 }}>{eyebrow}</div>}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 50, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1.6, color: ZINC_900 }}>
            {title.map((line) => (
              <div key={line} style={{ display: "flex", whiteSpace: "nowrap" }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 21, fontWeight: 500, lineHeight: 1.45, color: ZINC_600 }}>{subtitle}</div>
        </div>

        <div style={{ position: "absolute", left: TEXT_LEFT, top: 630 - EDGE - 24, height: 24, display: "flex", alignItems: "center", gap: 9, fontSize: 18, fontWeight: 700, color: ZINC_600 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ORANGE_600} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {url}
        </div>

        <div
          style={{
            position: "absolute",
            left: PANEL_LEFT,
            top: 0,
            width: 1200 - PANEL_LEFT,
            height: 630,
            display: "flex",
            borderLeft: `1.5px solid ${ZINC_200}`,
            backgroundImage: "linear-gradient(135deg, #fafafa 0%, #fff7ed 55%, #ffedd5 100%)",
          }}
        />
        <Graph />
      </div>
    ),
    {
      ...SHARE_SIZE,
      fonts: [
        { name: "Manrope", data: manrope500, weight: 500, style: "normal" },
        { name: "Manrope", data: manrope700, weight: 700, style: "normal" },
        { name: "Manrope", data: manrope800, weight: 800, style: "normal" },
      ],
    }
  );
}
