import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { CheckCircle2, AlertTriangle, XCircle, Check } from "lucide-react";
import Ajv from "ajv";
import addFormats from "ajv-formats";

interface JsonSchemaValidatorToolProps {
  onValidationChange?: (isValid: boolean) => void;
  onStatsChange?: (length: number, ms: number) => void;
  restoredInput?: string | null;
}

export function JsonSchemaValidatorTool({ onValidationChange, restoredInput }: JsonSchemaValidatorToolProps) {
  const parsedInput = restoredInput ? JSON.parse(restoredInput) : null;
  const [jsonText, setJsonText] = useState(parsedInput?.json || "{\n  \"name\": \"DevScratchpad\",\n  \"active\": true\n}");
  const [schemaText, setSchemaText] = useState(parsedInput?.schema || "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"name\": { \"type\": \"string\" },\n    \"active\": { \"type\": \"boolean\" }\n  },\n  \"required\": [\"name\"]\n}");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errors, setErrors] = useState<any[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  
  const ajvRef = useRef<Ajv | null>(null);

  useEffect(() => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    ajvRef.current = ajv;
  }, []);

  const validate = useCallback(() => {
    if (!ajvRef.current) return;
    
    setJsonError(null);
    setSchemaError(null);
    setErrors([]);
    
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e: any) {
      setJsonError("Invalid JSON Data: " + e.message);
      setIsValid(false);
      onValidationChange?.(false);
      return;
    }
    
    let schema;
    try {
      schema = JSON.parse(schemaText);
    } catch (e: any) {
      setSchemaError("Invalid JSON Schema: " + e.message);
      setIsValid(false);
      onValidationChange?.(false);
      return;
    }

    try {
      const validateFn = ajvRef.current.compile(schema);
      const valid = validateFn(data);
      setIsValid(valid);
      onValidationChange?.(valid);
      
      if (!valid) {
        setErrors(validateFn.errors || []);
      }
    } catch (e: any) {
      setSchemaError("Schema Compilation Error: " + e.message);
      setIsValid(false);
      onValidationChange?.(false);
    }
  }, [jsonText, schemaText, onValidationChange]);

  useEffect(() => {
    const timer = setTimeout(validate, 300);
    return () => clearTimeout(timer);
  }, [validate]);

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-zinc-200 bg-white shrink-0 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 min-w-max">
            {jsonError || schemaError ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                Parse Error
              </span>
            ) : isValid ? (
              <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md text-xs font-mono flex items-center gap-1">
                <Check className="w-3 h-3 text-zinc-900" />
                <span>Valid against Schema</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                {errors.length} Validation {errors.length === 1 ? "Error" : "Errors"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 border-b border-zinc-200">
        <div className="flex-1 border-r border-zinc-200 flex flex-col min-h-0">
          <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center shrink-0">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">JSON Data</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language="json"
              value={jsonText}
              onChange={(val) => setJsonText(val || "")}
              theme="light"
              options={{ minimap: { enabled: false }, tabSize: 2, wordWrap: "on" }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center shrink-0">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">JSON Schema (Draft 07)</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language="json"
              value={schemaText}
              onChange={(val) => setSchemaText(val || "")}
              theme="light"
              options={{ minimap: { enabled: false }, tabSize: 2, wordWrap: "on" }}
            />
          </div>
        </div>
      </div>

      {/* Error Output Console */}
      {(!isValid || jsonError || schemaError) && (
        <div className="h-48 shrink-0 bg-red-50/30 overflow-y-auto">
          <div className="px-3 py-1.5 bg-red-50 border-b border-red-100 flex items-center gap-2 sticky top-0">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">Validation Errors</span>
          </div>
          <div className="p-3 text-xs font-mono text-red-900">
            {jsonError && <div>{jsonError}</div>}
            {schemaError && <div>{schemaError}</div>}
            {!jsonError && !schemaError && errors.map((err, i) => (
              <div key={i} className="mb-2 pb-2 border-b border-red-100 last:border-0 last:mb-0 last:pb-0 flex gap-2">
                <span className="text-red-500 font-bold shrink-0">[{err.instancePath || "/"}]</span>
                <span>{err.message}</span>
                {err.params && <span className="text-red-400 opacity-80">{JSON.stringify(err.params)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
