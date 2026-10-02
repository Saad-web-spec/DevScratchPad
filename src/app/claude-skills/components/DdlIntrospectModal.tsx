"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  Check,
  AlertCircle,
  Table,
  ShieldCheck,
} from "lucide-react";
import {
  introspectDatabaseSchema,
  ParsedDatabaseSchema,
} from "../lib/ddlParser";
import { OutputFormat } from "../lib/ruleGenerator";

interface DdlIntrospectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (schema: ParsedDatabaseSchema, targetFormat?: OutputFormat) => void;
  initialFormat?: OutputFormat;
}

const SAMPLE_POSTGRES_DDL = `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(200) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_org_id ON projects(org_id);`;

const SAMPLE_PRISMA_SCHEMA = `model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}`;

const SAMPLE_SQLITE_DDL = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

export function DdlIntrospectModal({
  isOpen,
  onClose,
  onApply,
  initialFormat = "claude_md",
}: DdlIntrospectModalProps) {
  const [schemaText, setSchemaText] = useState("");
  const [parsed, setParsed] = useState<ParsedDatabaseSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(
    initialFormat === "mcp_json" ? "claude_md" : initialFormat
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(initialFormat === "mcp_json" ? "claude_md" : initialFormat);
    }
  }, [isOpen, initialFormat]);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setSchemaText(text);
    setError(null);
    if (!text.trim()) {
      setParsed(null);
      return;
    }

    try {
      const result = introspectDatabaseSchema(text);
      setParsed(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse schema.";
      setError(msg);
      setParsed(null);
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    onApply(parsed, selectedFormat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full overflow-hidden space-y-3.5 sm:space-y-4 p-4 sm:p-5 text-zinc-900 animate-in zoom-in-95 duration-150 transition-all max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between border-b border-zinc-100 pb-3 shrink-0 gap-2">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-900 font-sans tracking-tight">Introspect Database DDL / Prisma</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-orange-600" /> 100% Client-Side Private
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                Paste SQL DDL or Prisma models to synthesize schema-aware rules and safety guardrails.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1 sm:mr-0 sm:mt-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-3.5 pr-1">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] text-zinc-400 font-medium">Load Sample:</span>
            <button
              type="button"
              onClick={() => handleParse(SAMPLE_POSTGRES_DDL)}
              className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
            >
              PostgreSQL SaaS DDL
            </button>
            <button
              type="button"
              onClick={() => handleParse(SAMPLE_PRISMA_SCHEMA)}
              className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
            >
              Prisma Schema
            </button>
            <button
              type="button"
              onClick={() => handleParse(SAMPLE_SQLITE_DDL)}
              className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
            >
              SQLite DDL
            </button>
          </div>

          {/* DDL Input Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Schema Input (SQL DDL or Prisma)</label>
            <textarea
              rows={7}
              value={schemaText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="Paste CREATE TABLE statements or Prisma schema models here..."
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-y"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Schema Summary Preview */}
          {parsed && (
            <div className="space-y-2.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-zinc-900 px-2 py-0.5 rounded bg-zinc-200">
                    {parsed.dialect.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700">
                    {parsed.totalTables} Tables
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700">
                    {parsed.totalColumns} Columns
                  </span>
                </div>
              </div>

              {/* Table List & Relations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                {parsed.tables.slice(0, 6).map((tbl) => (
                  <div key={tbl.name} className="p-2 bg-white rounded-lg border border-zinc-200/80 space-y-0.5">
                    <div className="font-bold text-zinc-900 flex items-center gap-1">
                      <Table className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span className="truncate">{tbl.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      PK: {tbl.primaryKeys.join(", ") || "none"}
                    </div>
                    {tbl.foreignKeys.length > 0 && (
                      <div className="text-[10px] text-zinc-600 truncate">
                        FK: {tbl.foreignKeys.map((f) => `→ ${f.refTable}`).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Guardrails Synthesized */}
              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/80 text-xs text-zinc-700">
                <div className="text-[11px] font-medium text-zinc-500">
                  Synthesized Safety Guardrails
                </div>
                <ul className="space-y-0.5 pt-0.5 text-[11px] text-zinc-700 list-disc list-inside leading-relaxed">
                  {parsed.synthesizedDirectives.slice(0, 3).map((dir, i) => (
                    <li key={i} className="truncate">
                      {dir.replace(/^- /, "")}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target Format Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 text-xs">
                <span className="text-[11px] font-medium text-zinc-600">Synthesize To:</span>
                <div className="grid grid-cols-2 sm:flex items-center gap-1 w-full sm:w-auto">
                  {[
                    { label: "CLAUDE.md", value: "claude_md" as const },
                    { label: "cursor.mdc", value: "cursor_mdc" as const },
                    { label: "AGENTS.md", value: "agents_md" as const },
                    { label: "SKILL.md", value: "skill_md" as const },
                  ].map((fmt) => (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.value)}
                      className={`px-2.5 py-1.5 sm:py-0.5 rounded text-[11px] font-mono text-center transition-colors cursor-pointer min-h-[30px] sm:min-h-0 flex items-center justify-center ${
                        selectedFormat === fmt.value
                          ? "bg-zinc-900 text-white font-semibold"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!parsed}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-200 text-white disabled:text-zinc-400 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed min-h-[38px]"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Apply &amp; Generate {selectedFormat === "claude_md" ? "CLAUDE.md" : selectedFormat === "cursor_mdc" ? "cursor.mdc" : selectedFormat === "agents_md" ? "AGENTS.md" : "SKILL.md"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
