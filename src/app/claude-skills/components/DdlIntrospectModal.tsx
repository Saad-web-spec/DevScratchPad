"use client";

import React, { useState } from "react";
import { Database, Table2 } from "lucide-react";
import {
  introspectDatabaseSchema,
  ParsedDatabaseSchema,
} from "../lib/ddlParser";
import { OutputFormat } from "../lib/ruleGenerator";
import {
  IntakeError,
  IntakeFormatSwitch,
  IntakeModal,
  IntakeRow,
  initialIntakeFormat,
  intakeFormatLabel,
  intakePanelClass,
  intakePillClass,
  type IntakeFormat,
} from "./IntakeModal";

interface DdlIntrospectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (schema: ParsedDatabaseSchema, targetFormat?: OutputFormat) => void;
  initialFormat?: OutputFormat;
}

const PLACEHOLDER = `CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

-- or Prisma models:
model Post { id String @id  authorId String }`;

const DIALECT_LABELS: Record<ParsedDatabaseSchema["dialect"], string> = {
  postgresql: "PostgreSQL",
  sqlite: "SQLite",
  mysql: "MySQL",
  prisma: "Prisma",
  generic_sql: "SQL",
};

/** Mounted only while open, so each opening starts from the studio's current format. */
export function DdlIntrospectModal(props: DdlIntrospectModalProps) {
  if (!props.isOpen) return null;
  return <DdlIntrospectModalBody {...props} />;
}

function DdlIntrospectModalBody({ onClose, onApply, initialFormat }: DdlIntrospectModalProps) {
  const [schemaText, setSchemaText] = useState("");
  const [parsed, setParsed] = useState<ParsedDatabaseSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<IntakeFormat>(() => initialIntakeFormat(initialFormat));

  const handleParse = (text: string) => {
    setSchemaText(text);
    setError(null);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    try {
      setParsed(introspectDatabaseSchema(text));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse schema.");
      setParsed(null);
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    onApply(parsed, selectedFormat);
    onClose();
  };

  return (
    <IntakeModal
      icon={<Database className="size-4" />}
      title="Import database schema"
      subtitle="Paste SQL DDL or a Prisma schema to draft schema-aware data rules."
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmLabel={`Generate ${intakeFormatLabel(selectedFormat)}`}
      confirmDisabled={!parsed}
    >
      <textarea
        rows={8}
        autoFocus
        value={schemaText}
        onChange={(e) => handleParse(e.target.value)}
        placeholder={PLACEHOLDER}
        aria-label="SQL DDL or Prisma schema"
        spellCheck={false}
        className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 resize-y"
      />

      {error && <IntakeError message={error} />}

      {parsed && (
        <div className={intakePanelClass}>
          <div className="flex items-center gap-2 px-3 py-2 text-xs">
            <span className={intakePillClass}>{DIALECT_LABELS[parsed.dialect]}</span>
            <span className="text-zinc-500">
              {parsed.totalTables} {parsed.totalTables === 1 ? "table" : "tables"} · {parsed.totalColumns} columns
            </span>
          </div>

          {parsed.tables.length > 0 && (
            <IntakeRow label="Tables">
              <ul className="space-y-0.5 font-mono text-[11px] text-zinc-700">
                {parsed.tables.slice(0, 6).map((tbl) => (
                  <li key={tbl.name} className="flex items-center gap-1.5 min-w-0">
                    <Table2 className="size-3 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-900 shrink-0">{tbl.name}</span>
                    <span className="text-zinc-400 truncate">
                      pk {tbl.primaryKeys.join(", ") || "none"}
                      {tbl.foreignKeys.length > 0 && ` · → ${tbl.foreignKeys.map((f) => f.refTable).join(", ")}`}
                    </span>
                  </li>
                ))}
                {parsed.tables.length > 6 && <li className="text-zinc-400">+{parsed.tables.length - 6} more</li>}
              </ul>
            </IntakeRow>
          )}

          <IntakeRow label="Draft guardrails">
            <ul className="space-y-0.5 text-xs text-zinc-700 leading-relaxed">
              {parsed.synthesizedDirectives.slice(0, 3).map((dir, i) => (
                <li key={i} className="truncate">
                  {dir.replace(/^- /, "")}
                </li>
              ))}
            </ul>
          </IntakeRow>

          <IntakeFormatSwitch value={selectedFormat} onChange={setSelectedFormat} />
        </div>
      )}
    </IntakeModal>
  );
}
