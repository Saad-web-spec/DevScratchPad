import type { loader as MonacoLoader } from "@monaco-editor/react";

/** Same-origin Monaco build copied from node_modules by scripts/copy-monaco.mjs (predev / prebuild). */
export const MONACO_VS_PATH = "/monaco/vs";

/**
 * Points @monaco-editor/react at the self-hosted Monaco build instead of its cdn.jsdelivr.net default.
 * Must run before the first `loader.init()` / editor mount; calling it repeatedly is harmless.
 */
export function configureMonacoLoader(loader: typeof MonacoLoader): void {
  loader.config({ paths: { vs: MONACO_VS_PATH } });
}
