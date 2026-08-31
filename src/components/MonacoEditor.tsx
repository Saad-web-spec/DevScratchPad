"use client";

import dynamic from "next/dynamic";
import type { EditorProps, DiffEditorProps } from "@monaco-editor/react";

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-full bg-white">
    <div className="flex items-center gap-2 text-zinc-400 text-sm">
      <div className="w-4 h-4 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
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
  const enhancedOptions = {
    maxTokenizationLineLength: 200000,
    unicodeHighlight: { ambiguousCharacters: false },
    ...props.options
  };

  return (
    <InternalEditor 
      {...props} 
      options={enhancedOptions}
      theme="vs" 
    />
  );
}

export function MonacoDiffEditor(props: DiffEditorProps) {
  const enhancedOptions = {
    maxTokenizationLineLength: 200000,
    unicodeHighlight: { ambiguousCharacters: false },
    ...props.options
  };

  return (
    <InternalDiffEditor 
      {...props} 
      options={enhancedOptions}
      theme="vs"
    />
  );
}
