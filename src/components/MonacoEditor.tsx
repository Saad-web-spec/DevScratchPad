"use client";

import dynamic from "next/dynamic";
import type { EditorProps, DiffEditorProps } from "@monaco-editor/react";

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-full bg-white">
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
      Loading editor…
    </div>
  </div>
);

export const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<EditorProps>;

export const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<DiffEditorProps>;
