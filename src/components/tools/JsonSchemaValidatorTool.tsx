"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ErrorObject, ValidateFunction } from "ajv";
import { MonacoEditor } from "@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { AlertTriangle, XCircle, Check, Trash2, Loader2 } from "lucide-react";
import { addSnapshot } from "@/lib/storage";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolHeader, PaneBar, EDITOR_OPTIONS, btnIcon, iconProps } from "@/components/tools/ToolChrome";

interface JsonSchemaValidatorToolProps {
  onValidationChange?: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange?: (length: number, ms: number) => void;
  restoredInput?: string | null;
}

type Draft = "draft-07" | "2019-09" | "2020-12";

/** Which JSON Schema dialect a schema declares through `$schema` (draft-07 when absent). */
function detectDraft(schema: unknown): Draft {
  const declared =
    schema && typeof schema === "object" && "$schema" in schema ? String((schema as { $schema: unknown }).$schema) : "";
  if (declared.includes("2020-12")) return "2020-12";
  if (declared.includes("2019-09")) return "2019-09";
  return "draft-07";
}

/**
 * Ajv is large, so it loads after the tool paints. The 2019-09 / 2020-12 builds load only
 * when a schema asks for them (the default Ajv class rejects those `$schema` URIs).
 */
async function createValidator(schema: object, draft: Draft): Promise<ValidateFunction> {
  const [{ default: addFormats }, AjvClass] = await Promise.all([
    import("ajv-formats"),
    draft === "2020-12"
      ? import("ajv/dist/2020").then((m) => m.default)
      : draft === "2019-09"
        ? import("ajv/dist/2019").then((m) => m.default)
        : import("ajv").then((m) => m.default),
  ]);
  // A fresh instance per schema: re-compiling a schema with an `$id` on a shared instance
  // throws "schema with key or id already exists".
  const ajv = new AjvClass({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

const DEFAULT_JSON = "{\n  \"name\": \"DevScratchpad\",\n  \"active\": true\n}";
const DEFAULT_SCHEMA = "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"name\": { \"type\": \"string\" },\n    \"active\": { \"type\": \"boolean\" }\n  },\n  \"required\": [\"name\"]\n}";

export function JsonSchemaValidatorTool({ onValidationChange, onStatsChange, restoredInput }: JsonSchemaValidatorToolProps) {
  const parsedInput = parseRestored(restoredInput);
  const [jsonText, setJsonText] = useState(parsedInput?.json || DEFAULT_JSON);
  const [schemaText, setSchemaText] = useState(parsedInput?.schema || DEFAULT_SCHEMA);
  const [errors, setErrors] = useState<ErrorObject[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>("draft-07");
  const [isChecking, setIsChecking] = useState(true);

  // Compiled validator for the current schema text; recompiled only when the schema changes.
  const compiledRef = useRef<{ schemaText: string; validate: ValidateFunction } | null>(null);

  // Restore from share link / history after mount (the initial state only sees the first render)
  useEffect(() => {
    const restored = parseRestored(restoredInput);
    if (!restored) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof restored.json === "string") setJsonText(restored.json);
    if (typeof restored.schema === "string") setSchemaText(restored.schema);
  }, [restoredInput]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("json-schema-validator", "JSON Schema Validator", JSON.stringify({ json: jsonText, schema: schemaText }), "");
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [jsonText, schemaText]);

  // Debounced validation (300ms) so typing in either editor stays smooth.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const start = performance.now();
      const fail = (setter: (msg: string) => void, msg: string) => {
        if (cancelled) return;
        setter(msg);
        setErrors([]);
        setIsValid(false);
        setIsChecking(false);
        onValidationChange?.(false, msg);
      };

      let data: unknown;
      try {
        data = JSON.parse(jsonText);
      } catch (e: unknown) {
        setSchemaError(null);
        return fail(setJsonError, "Invalid JSON Data: " + (e instanceof Error ? e.message : String(e)));
      }

      let schema: unknown;
      try {
        schema = JSON.parse(schemaText);
      } catch (e: unknown) {
        setJsonError(null);
        return fail(setSchemaError, "Invalid JSON Schema: " + (e instanceof Error ? e.message : String(e)));
      }
      if (!schema || typeof schema !== "object") {
        setJsonError(null);
        return fail(setSchemaError, "Invalid JSON Schema: the schema must be a JSON object");
      }

      const schemaDraft = detectDraft(schema);
      try {
        if (!compiledRef.current || compiledRef.current.schemaText !== schemaText) {
          const validate = await createValidator(schema, schemaDraft);
          compiledRef.current = { schemaText, validate };
        }
      } catch (e: unknown) {
        setJsonError(null);
        return fail(setSchemaError, "Schema Compilation Error: " + (e instanceof Error ? e.message : String(e)));
      }
      if (cancelled) return;

      const validateFn = compiledRef.current.validate;
      const valid = validateFn(data) as boolean;
      setJsonError(null);
      setSchemaError(null);
      setDraft(schemaDraft);
      setIsValid(valid);
      setErrors(valid ? [] : [...(validateFn.errors ?? [])]);
      setIsChecking(false);
      onValidationChange?.(valid, valid ? undefined : validateFn.errors?.[0]?.message);
      onStatsChange?.(jsonText.length, performance.now() - start);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jsonText, schemaText, onValidationChange, onStatsChange]);

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Toolbar */}
      <ToolHeader
        icon={getToolIcon("json-schema-validator")}
        title="JSON Schema Validator"
        utilities={
          <ShareMenu
            toolSlug="json-schema-validator"
            data={{ json: jsonText, schema: schemaText }}
            imageCode={jsonText}
            imageLanguage="json"
          />
        }
        options={
          isChecking ? (
            <span className="inline-flex h-8 items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Loader2 {...iconProps} className="size-3.5 shrink-0 animate-spin" />
              Checking…
            </span>
          ) : jsonError || schemaError ? (
            <span className="inline-flex h-8 items-center gap-1.5 text-xs font-medium text-red-600">
              <XCircle {...iconProps} className="size-3.5 shrink-0" />
              Parse error
            </span>
          ) : isValid ? (
            <span className="inline-flex h-8 items-center gap-1.5 text-xs font-medium text-zinc-700">
              <Check {...iconProps} className="size-3.5 shrink-0" />
              Valid
            </span>
          ) : (
            <span className="inline-flex h-8 items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertTriangle {...iconProps} className="size-3.5 shrink-0" />
              {errors.length} {errors.length === 1 ? "error" : "errors"}
            </span>
          )
        }
      />

      {/* Editor Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 border-b border-zinc-200">
        <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col min-h-0 min-w-0">
          <PaneBar label="JSON Data">
            <button onClick={() => setJsonText("")} className={btnIcon} title="Clear JSON data" aria-label="Clear JSON data">
              <Trash2 {...iconProps} />
            </button>
          </PaneBar>
          <div className="flex-1 relative min-h-[160px]">
            <MonacoEditor
              height="100%"
              language="json"
              value={jsonText}
              onChange={(val) => setJsonText(val || "")}
              options={EDITOR_OPTIONS}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <PaneBar
            label={
              <>
                JSON Schema
                <span className="ml-1.5 rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal text-zinc-600">
                  {draft}
                </span>
              </>
            }
          >
            <button onClick={() => setSchemaText("")} className={btnIcon} title="Clear schema" aria-label="Clear schema">
              <Trash2 {...iconProps} />
            </button>
          </PaneBar>
          <div className="flex-1 relative min-h-[160px]">
            <MonacoEditor
              height="100%"
              language="json"
              value={schemaText}
              onChange={(val) => setSchemaText(val || "")}
              options={EDITOR_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Error Output Console */}
      {!isChecking && (!isValid || jsonError || schemaError) && (
        <div className="h-40 md:h-48 shrink-0 bg-red-50/30 overflow-y-auto">
          <div className="h-9 px-3 bg-red-50 border-b border-red-100 flex items-center gap-2 sticky top-0">
            <XCircle {...iconProps} className="size-3.5 shrink-0" />
            <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">Validation Errors</span>
          </div>
          <div className="p-3 text-xs font-mono text-red-900 break-words">
            {jsonError && <div>{jsonError}</div>}
            {schemaError && <div>{schemaError}</div>}
            {!jsonError && !schemaError && errors.map((err, i) => (
              <div key={i} className="mb-2 pb-2 border-b border-red-100 last:border-0 last:mb-0 last:pb-0 flex flex-wrap gap-x-2 gap-y-0.5">
                <span className="text-red-500 font-bold shrink-0">[{err.instancePath || "/"}]</span>
                <span>{err.message}</span>
                {err.params && <span className="text-red-500/80 break-all">{JSON.stringify(err.params)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Restored payloads are `{ json, schema }`; anything else (magic paste, stale links) is ignored. */
function parseRestored(raw: string | null | undefined): { json?: string; schema?: string } | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as { json?: string; schema?: string }) : null;
  } catch {
    return null;
  }
}
