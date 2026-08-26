"use client";

import dynamic from "next/dynamic";
import type { EditorProps, DiffEditorProps } from "@monaco-editor/react";
import { useTheme } from "@/lib/theme";

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-slate-950">
    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
      <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      Loading editor…
    </div>
  </div>
);

const InternalEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<EditorProps>;

const InternalDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<DiffEditorProps>;

export function MonacoEditor(props: EditorProps) {
  const { theme: appTheme } = useTheme();
  const editorTheme = appTheme === "dark" ? "vs-dark" : "vs";
  return <InternalEditor {...props} theme={props.theme === "vs-dark" ? "vs-dark" : editorTheme} />;
}

export function MonacoDiffEditor(props: DiffEditorProps) {
  const { theme: appTheme } = useTheme();
  const editorTheme = appTheme === "dark" ? "vs-dark" : "vs";
  return <InternalDiffEditor {...props} theme={props.theme === "vs-dark" ? "vs-dark" : editorTheme} />;
}
