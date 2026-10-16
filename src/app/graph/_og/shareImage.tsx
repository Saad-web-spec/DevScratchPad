/**
 * Share card for /graph and its guide (Open Graph for LinkedIn/WhatsApp/Slack, and the X large card).
 * Rendered by next/og at build time.
 *
 * Feeds show this card at a quarter of its size, so it carries one message and little else: the brand, a large
 * two-line headline, one line under it, the compile targets, and on the right the smallest graph that says what
 * the studio does (a goal fans out to two parallel workers, which a fresh-context verifier checks). The graph runs
 * top to bottom so its four nodes can be large; all four use the same white card. White and zinc, black for the
 * solid edges, and orange only for the highlighted words and the fresh-context edges.
 *
 * Nothing important sits in the bottom-left corner, where X draws its own domain label over the image.
 *
 * After a design change, update the date comment in the four opengraph-image / twitter-image route files:
 * the image URL hash comes from those files, and LinkedIn and X keep showing the old image until it changes.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const SHARE_SIZE = { width: 1200, height: 630 };

const ZINC_950 = "#09090b";
const ZINC_700 = "#3f3f46";
const ZINC_600 = "#52525b";
const ZINC_500 = "#71717a";
const ZINC_300 = "#d4d4d8";
const ZINC_200 = "#e4e4e7";
const ZINC_100 = "#f4f4f5";
const ZINC_50 = "#fafafa";
const ORANGE_50 = "#fff7ed";
const ORANGE_200 = "#fed7aa";
const ORANGE_600 = "#ea580c";
const ORANGE_700 = "#c2410c";

const fontFile = (name: string) => readFile(join(process.cwd(), "src/app/graph/_og", name));

/* ---------------------------------------------------------------- layout */

const MARGIN = 64;
/** The dotted editor panel on the right; the text column ends 40px before it. */
const PANEL_LEFT = 652;
const PANEL_CENTER = (PANEL_LEFT + SHARE_SIZE.width) / 2;

const NODE_W = 218;
const NODE_H = 84;
/** Gap between the two parallel workers. */
const PAIR_GAP = 36;
/** Vertical centres of the three stages. */
const ROWS = [128, 315, 502];

/* ---------------------------------------------------------------- the graph */

type IconName = "input" | "worker" | "verifier";

const ICONS: Record<IconName, React.ReactNode[]> = {
  input: [<circle key="a" cx="12" cy="12" r="9" />, <circle key="b" cx="12" cy="12" r="2.5" />],
  worker: [
    <rect key="a" x="4" y="4" width="16" height="16" rx="2" />,
    <rect key="b" x="9" y="9" width="6" height="6" rx="1" />,
    <path key="c" d="M12 20v2M12 2v2M17 20v2M17 2v2M2 12h2M2 17h2M2 7h2M20 12h2M20 17h2M20 7h2M7 20v2M7 2v2" />,
  ],
  verifier: [
    <path key="a" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
    <path key="b" d="m9 12 2 2 4-4" />,
  ],
};

interface NodeProps {
  cx: number;
  cy: number;
  icon: IconName;
  label: string;
  meta: string;
  /** Shown in the icon tile instead of the icon (the guide numbers its stages). */
  step?: number;
}

/** A node card shaped like the studio's: icon tile, then the step name over its role. */
function Node({ cx, cy, icon, label, meta, step }: NodeProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: cx - NODE_W / 2,
        top: cy - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 18px",
        borderRadius: 18,
        backgroundColor: "white",
        border: `2px solid ${ZINC_300}`,
        boxShadow: "0 8px 20px rgba(24, 24, 27, 0.07)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: ORANGE_50,
          border: `1.5px solid ${ORANGE_200}`,
          fontSize: 22,
          fontWeight: 800,
          color: ORANGE_700,
        }}
      >
        {step ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ORANGE_600} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {ICONS[icon]}
          </svg>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, color: ZINC_950 }}>
          {label}
        </div>
        <div style={{ display: "flex", fontSize: 16, fontWeight: 700, color: ZINC_500 }}>{meta}</div>
      </div>
    </div>
  );
}

/** Dotted editor canvas (Satori has no SVG patterns, so the dots are plain circles). */
const DOT_STEP = 26;
const DOTS: { cx: number; cy: number }[] = [];
for (let cy = 20; cy < SHARE_SIZE.height; cy += DOT_STEP) {
  for (let cx = PANEL_LEFT + 20; cx < SHARE_SIZE.width; cx += DOT_STEP) DOTS.push({ cx, cy });
}

function GraphPanel({ numbered }: { numbered: boolean }) {
  const workers = [PANEL_CENTER - (NODE_W + PAIR_GAP) / 2, PANEL_CENTER + (NODE_W + PAIR_GAP) / 2];
  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const bend = (y2 - y1) / 2;
    return `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;
  };
  const top = (row: number) => ROWS[row] - NODE_H / 2;
  const bottom = (row: number) => ROWS[row] + NODE_H / 2;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SHARE_SIZE.width, height: SHARE_SIZE.height, display: "flex" }}>
      <div
        style={{
          position: "absolute",
          left: PANEL_LEFT,
          top: 0,
          width: SHARE_SIZE.width - PANEL_LEFT,
          height: SHARE_SIZE.height,
          backgroundColor: ZINC_50,
          borderLeft: `2px solid ${ZINC_200}`,
          display: "flex",
        }}
      />
      <svg width={SHARE_SIZE.width} height={SHARE_SIZE.height} viewBox={`0 0 ${SHARE_SIZE.width} ${SHARE_SIZE.height}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {DOTS.map((d) => (
          <circle key={`${d.cx}-${d.cy}`} cx={d.cx} cy={d.cy} r="1.7" fill={ZINC_300} />
        ))}
        {/* Goal fans out to the workers; their results reach the verifier with no worker reasoning (dashed). */}
        {workers.map((x) => (
          <path key={`a-${x}`} d={curve(PANEL_CENTER, bottom(0), x, top(1))} fill="none" stroke={ZINC_950} strokeWidth="4" strokeLinecap="round" />
        ))}
        {workers.map((x) => (
          <path key={`b-${x}`} d={curve(x, bottom(1), PANEL_CENTER, top(2))} fill="none" stroke={ORANGE_600} strokeWidth="4" strokeDasharray="9 8" strokeLinecap="round" />
        ))}
      </svg>
      <Node cx={PANEL_CENTER} cy={ROWS[0]} icon="input" label="Goal" meta="splits the task" step={numbered ? 1 : undefined} />
      <Node cx={workers[0]} cy={ROWS[1]} icon="worker" label="Research" meta="parallel" step={numbered ? 2 : undefined} />
      <Node cx={workers[1]} cy={ROWS[1]} icon="worker" label="Review" meta="parallel" step={numbered ? 2 : undefined} />
      <Node cx={PANEL_CENTER} cy={ROWS[2]} icon="verifier" label="Verify" meta="fresh context" step={numbered ? 3 : undefined} />
      {/* Ports on the node borders, drawn last so they sit on top of the cards. */}
      <svg width={SHARE_SIZE.width} height={SHARE_SIZE.height} viewBox={`0 0 ${SHARE_SIZE.width} ${SHARE_SIZE.height}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={PANEL_CENTER} cy={bottom(0)} r="6" fill="white" stroke={ZINC_950} strokeWidth="2.5" />
        {workers.map((x) => (
          <circle key={`in-${x}`} cx={x} cy={top(1)} r="6" fill="white" stroke={ZINC_950} strokeWidth="2.5" />
        ))}
        {workers.map((x) => (
          <circle key={`out-${x}`} cx={x} cy={bottom(1)} r="6" fill="white" stroke={ORANGE_600} strokeWidth="2.5" />
        ))}
        <circle cx={PANEL_CENTER} cy={top(2)} r="6" fill="white" stroke={ZINC_950} strokeWidth="2.5" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- brand and text */

/** The Skill Graph mark (same glyph as `SkillGraphIcon`) on a white tile. */
function Mark() {
  return (
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: "white",
        border: `2px solid ${ZINC_200}`,
        boxShadow: "0 4px 12px rgba(24, 24, 27, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={ZINC_950} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12c3.5 0 4-6 8-6" />
        <path d="M8 12c3.5 0 4 6 8 6" />
        <rect x="2" y="9" width="6" height="6" rx="1.75" />
        <rect x="16" y="3" width="6" height="6" rx="1.75" />
        <rect x="16" y="15" width="6" height="6" rx="1.75" fill={ORANGE_600} stroke={ORANGE_600} />
      </svg>
    </div>
  );
}

export interface ShareCardProps {
  /** Short orange label next to the wordmark (e.g. "Guide"); optional. */
  eyebrow?: string;
  /** Headline lines, each kept on one line (Satori would otherwise break "multi-agent" at the hyphen). */
  title: string[];
  /** Words in the last headline line to set in orange. */
  highlight?: string;
  subtitle: string;
  /** The page's address (without the protocol). */
  url: string;
  /** Number the graph's stages instead of showing node icons. */
  numbered?: boolean;
}

const COMPILE_TARGETS = ["SKILL.md", "Subagents", "Cursor .mdc"];

/** A headline line with `highlight` (if it occurs in the line) set in orange. */
function HeadlineLine({ line, highlight }: { line: string; highlight?: string }) {
  const at = highlight ? line.indexOf(highlight) : -1;
  if (!highlight || at < 0) return <div style={{ display: "flex", whiteSpace: "pre" }}>{line}</div>;
  return (
    <div style={{ display: "flex", whiteSpace: "pre" }}>
      <span>{line.slice(0, at)}</span>
      <span style={{ color: ORANGE_600 }}>{highlight}</span>
      <span>{line.slice(at + highlight.length)}</span>
    </div>
  );
}

export async function renderShareImage({ eyebrow, title, highlight, subtitle, url, numbered = false }: ShareCardProps): Promise<ImageResponse> {
  const [manrope500, manrope700, manrope800] = await Promise.all([
    fontFile("manrope-500.woff"),
    fontFile("manrope-700.woff"),
    fontFile("manrope-800.woff"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "white", fontFamily: "Manrope" }}>
        <GraphPanel numbered={numbered} />

        <div
          style={{
            position: "absolute",
            left: MARGIN,
            top: 0,
            width: PANEL_LEFT - MARGIN - 40,
            height: SHARE_SIZE.height,
            display: "flex",
            flexDirection: "column",
            paddingTop: 58,
          }}
        >
          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Mark />
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: -0.8, color: ZINC_950 }}>Skill Graph</div>
            {eyebrow && (
              <div
                style={{
                  display: "flex",
                  marginLeft: 4,
                  padding: "4px 12px",
                  borderRadius: 999,
                  backgroundColor: ORANGE_50,
                  border: `1.5px solid ${ORANGE_200}`,
                  fontSize: 18,
                  fontWeight: 800,
                  color: ORANGE_700,
                }}
              >
                {eyebrow}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 76, fontSize: 60, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2.4, color: ZINC_950 }}>
            {title.map((line, index) => (
              <HeadlineLine key={line} line={line} highlight={index === title.length - 1 ? highlight : undefined} />
            ))}
          </div>

          <div style={{ display: "flex", marginTop: 22, fontSize: 24, fontWeight: 700, lineHeight: 1.35, color: ZINC_600 }}>{subtitle}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 34 }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: ZINC_500, marginRight: 2 }}>Compiles to</div>
            {COMPILE_TARGETS.map((target) => (
              <div
                key={target}
                style={{
                  display: "flex",
                  padding: "6px 12px",
                  borderRadius: 10,
                  backgroundColor: ZINC_100,
                  border: `1.5px solid ${ZINC_200}`,
                  fontSize: 18,
                  fontWeight: 800,
                  color: ZINC_700,
                }}
              >
                {target}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 30, fontSize: 21, fontWeight: 700, color: ZINC_700 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE_600} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {url}
          </div>
        </div>
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
