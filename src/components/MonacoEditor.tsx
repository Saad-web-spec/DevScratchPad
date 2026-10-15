"use client";

import dynamic from "next/dynamic";
import type { EditorProps, DiffEditorProps, Monaco } from "@monaco-editor/react";
import { configureMonacoLoader } from "@/lib/monacoLoader";

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-full bg-white">
    <div className="flex items-center gap-2 text-zinc-400 text-sm">
      <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      Loading editor…
    </div>
  </div>
);

const InternalEditor = dynamic(
  () =>
    import("@monaco-editor/react").then((mod) => {
      configureMonacoLoader(mod.loader);
      return mod.default;
    }),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<EditorProps>;

const InternalDiffEditor = dynamic(
  () =>
    import("@monaco-editor/react").then((mod) => {
      configureMonacoLoader(mod.loader);
      return mod.DiffEditor;
    }),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<DiffEditorProps>;

/** Minimal light theme shared by every tool editor: ink text, two muted accents, no boxed line highlight. */
const THEME_NAME = "devscratchpad-light";

/** Same stack as the site's `--font-mono` (Geist Mono is self-hosted through globals.css). */
const EDITOR_FONT_FAMILY = "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function defineEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME_NAME, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "27272a" },
      { token: "comment", foreground: "a1a1aa", fontStyle: "italic" },
      { token: "string", foreground: "166534" },
      { token: "string.key.json", foreground: "18181b" },
      { token: "number", foreground: "1e40af" },
      { token: "keyword", foreground: "18181b", fontStyle: "bold" },
      { token: "keyword.json", foreground: "1e40af", fontStyle: "" },
      { token: "type", foreground: "3f3f46" },
      { token: "delimiter", foreground: "a1a1aa" },
      { token: "tag", foreground: "18181b" },
      { token: "metatag", foreground: "71717a" },
      { token: "attribute.name", foreground: "52525b" },
      { token: "attribute.value", foreground: "166534" },
      { token: "regexp", foreground: "166534" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#27272a",
      "editorGutter.background": "#ffffff",
      "editorLineNumber.foreground": "#d4d4d8",
      "editorLineNumber.activeForeground": "#52525b",
      "editor.lineHighlightBackground": "#fafafa",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#e4e4e7",
      "editor.inactiveSelectionBackground": "#f4f4f5",
      "editor.selectionHighlightBackground": "#f4f4f5",
      "editor.wordHighlightBackground": "#f4f4f5",
      "editor.findMatchBackground": "#fde68a",
      "editor.findMatchHighlightBackground": "#fef3c780",
      "editorCursor.foreground": "#18181b",
      "editorWhitespace.foreground": "#e4e4e7",
      "editorIndentGuide.background1": "#f4f4f5",
      "editorIndentGuide.activeBackground1": "#e4e4e7",
      "editorBracketMatch.background": "#f4f4f5",
      "editorBracketMatch.border": "#d4d4d8",
      "editorOverviewRuler.border": "#00000000",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#e4e4e7",
      "editorSuggestWidget.selectedBackground": "#f4f4f5",
      "scrollbarSlider.background": "#d4d4d866",
      "scrollbarSlider.hoverBackground": "#a1a1aa80",
      "scrollbarSlider.activeBackground": "#71717a80",
      "diffEditor.insertedTextBackground": "#16a34a26",
      "diffEditor.removedTextBackground": "#dc262626",
      "diffEditor.insertedLineBackground": "#16a34a0d",
      "diffEditor.removedLineBackground": "#dc26260d",
      focusBorder: "#00000000",
    },
  });
}

/** Dark theme used by the code-image export (its frame paints the background, so the editor stays transparent). */
const DARK_THEME_NAME = "devscratchpad-dark";

function defineDarkTheme(monaco: Monaco) {
  monaco.editor.defineTheme(DARK_THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "e4e4e7" },
      { token: "comment", foreground: "71717a", fontStyle: "italic" },
      { token: "string", foreground: "86efac" },
      { token: "string.key.json", foreground: "f4f4f5" },
      { token: "number", foreground: "93c5fd" },
      { token: "keyword", foreground: "f4f4f5", fontStyle: "bold" },
      { token: "keyword.json", foreground: "93c5fd", fontStyle: "" },
      { token: "delimiter", foreground: "71717a" },
      { token: "tag", foreground: "f4f4f5" },
      { token: "attribute.name", foreground: "a1a1aa" },
      { token: "attribute.value", foreground: "86efac" },
    ],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.foreground": "#e4e4e7",
      "editorLineNumber.foreground": "#52525b",
      "editor.lineHighlightBackground": "#00000000",
      "editor.lineHighlightBorder": "#00000000",
      focusBorder: "#00000000",
    },
  });
}

/** Re-measure glyph widths once the web font has loaded so the cursor and selections line up with the text. */
function remeasureWhenFontsReady(monaco: Monaco) {
  if (typeof document === "undefined" || !document.fonts) return;
  document.fonts.ready.then(() => monaco.editor.remeasureFonts()).catch(() => {});
}

/** Defaults a tool can override (behaviour and layout). */
const DEFAULT_OPTIONS = {
  maxTokenizationLineLength: 200000,
  unicodeHighlight: { ambiguousCharacters: false },
  fontSize: 13,
  lineHeight: 20,
  padding: { top: 12, bottom: 12 },
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  showFoldingControls: "mouseover",
  fixedOverflowWidgets: true,
  renderLineHighlight: "line",
  renderLineHighlightOnlyWhenFocus: true,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 10,
  glyphMargin: false,
  guides: { indentation: true, highlightActiveIndentation: false },
} as const;

/** Slim scrollbars without shadows; merged key by key so a tool can still hide or resize them. */
const DEFAULT_SCROLLBAR = { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false } as const;

/** Visual options every editor shares, applied after the tool's own options so all panes look the same. */
const ENFORCED_OPTIONS = {
  fontFamily: EDITOR_FONT_FAMILY,
  fontLigatures: false,
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
} as const;

export function MonacoEditor(props: EditorProps) {
  const { beforeMount, onMount } = props;
  const options = {
    ...DEFAULT_OPTIONS,
    ...props.options,
    ...ENFORCED_OPTIONS,
    // A page with its own typography (e.g. /graph) may pass its code font; every other editor keeps the site font.
    fontFamily: props.options?.fontFamily ?? ENFORCED_OPTIONS.fontFamily,
    scrollbar: { ...DEFAULT_SCROLLBAR, ...props.options?.scrollbar },
  };

  return (
    <InternalEditor
      {...props}
      options={options}
      theme={props.theme ?? THEME_NAME}
      beforeMount={(monaco) => {
        defineEditorTheme(monaco);
        defineDarkTheme(monaco);
        beforeMount?.(monaco);
      }}
      onMount={(editor, monaco) => {
        remeasureWhenFontsReady(monaco);
        onMount?.(editor, monaco);
      }}
    />
  );
}

export function MonacoDiffEditor(props: DiffEditorProps) {
  const { beforeMount, onMount } = props;
  const options = {
    ...DEFAULT_OPTIONS,
    ...props.options,
    ...ENFORCED_OPTIONS,
    scrollbar: { ...DEFAULT_SCROLLBAR, ...props.options?.scrollbar },
  };

  return (
    <InternalDiffEditor
      {...props}
      options={options}
      theme={props.theme ?? THEME_NAME}
      beforeMount={(monaco) => {
        defineEditorTheme(monaco);
        defineDarkTheme(monaco);
        beforeMount?.(monaco);
      }}
      onMount={(editor, monaco) => {
        remeasureWhenFontsReady(monaco);
        onMount?.(editor, monaco);
      }}
    />
  );
}
