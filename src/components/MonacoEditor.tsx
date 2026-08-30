"use client";

import dynamic from "next/dynamic";
import type { EditorProps, DiffEditorProps } from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-zinc-950">
    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-sm">
      <div className="w-4 h-4 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
      Loading editor…
    </div>
  </div>
);

const handleEditorWillMount = (monaco: Monaco) => {
  monaco.editor.defineTheme('devscratchpad-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { background: '09090B' }
    ],
    colors: {
      'editor.background': '#09090B',
      'editor.lineHighlightBackground': '#18181B',
      'editorLineNumber.foreground': '#71717A',
      'editorIndentGuide.background': '#27272A',
      'editorWidget.background': '#18181B',
      'editorWidget.border': '#27272A',
    }
  });
};

const InternalEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<EditorProps>;

const InternalDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false, loading: LoadingPlaceholder }
) as React.ComponentType<DiffEditorProps>;

export function MonacoEditor(props: EditorProps) {
  const editorTheme = "vs";
  
  return (
    <InternalEditor 
      {...props} 
      theme={editorTheme} 
      beforeMount={(monaco) => {
        handleEditorWillMount(monaco);
        if (props.beforeMount) props.beforeMount(monaco);
      }}
    />
  );
}

export function MonacoDiffEditor(props: DiffEditorProps) {
  const editorTheme = "vs";
  
  return (
    <InternalDiffEditor 
      {...props} 
      theme={editorTheme}
      beforeMount={(monaco) => {
        handleEditorWillMount(monaco);
        if (props.beforeMount) props.beforeMount(monaco);
      }}
    />
  );
}
