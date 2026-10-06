/**
 * Client-Side SQL DDL & Prisma Schema Introspector
 * 100% Client-Side execution (ADR-001) - Zero Server Transmission.
 * Extracts tables, columns, relations, and indexes to synthesize Database Pair Programmer rules.
 */

export interface DdlColumn {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  isUnique: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface DdlTable {
  name: string;
  columns: DdlColumn[];
  primaryKeys: string[];
  foreignKeys: Array<{
    column: string;
    refTable: string;
    refColumn: string;
  }>;
  indexes: string[];
}

export interface ParsedDatabaseSchema {
  dialect: "postgresql" | "sqlite" | "mysql" | "prisma" | "generic_sql";
  tables: DdlTable[];
  totalTables: number;
  totalColumns: number;
  relationships: Array<{
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
  }>;
  synthesizedDirectives: string[];
  synthesizedProcedures: string[];
  synthesizedRole: string;
  suggestedTitle: string;
}

/**
 * Detects if the input is Prisma schema or SQL DDL
 */
export function detectSchemaDialect(
  input: string
): "prisma" | "postgresql" | "sqlite" | "mysql" | "generic_sql" {
  const lower = input.toLowerCase();
  if (lower.includes("model ") && (lower.includes("@id") || lower.includes("datasource db"))) {
    return "prisma";
  }
  if (lower.includes("jsonb") || lower.includes("serial") || lower.includes("uuid_generate") || lower.includes("timestamptz")) {
    return "postgresql";
  }
  if (lower.includes("autoincrement") || lower.includes("without rowid") || lower.includes("integer primary key")) {
    return "sqlite";
  }
  if (lower.includes("auto_increment") || lower.includes("engine=innodb")) {
    return "mysql";
  }
  return "generic_sql";
}

/**
 * Parses Prisma Schema `model Table { ... }` blocks
 */
function parsePrismaSchema(input: string): DdlTable[] {
  const tables: DdlTable[] = [];
  const modelRegex = /model\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(input)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns: DdlColumn[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: DdlTable["foreignKeys"] = [];

    const lines = body.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;

      const tokens = line.split(/\s+/);
      if (tokens.length >= 2) {
        const colName = tokens[0];
        const colType = tokens[1];
        const isPrimary = line.includes("@id");
        const isUnique = line.includes("@unique");
        const isNullable = colType.endsWith("?");

        if (isPrimary) primaryKeys.push(colName);

        // Check relation @relation(fields: [authorId], references: [id])
        const relMatch = line.match(/@relation\([^)]*fields:\s*\[([^\]]+)\],[^)]*references:\s*\[([^\]]+)\]/);
        if (relMatch) {
          const fromCol = relMatch[1].trim();
          const toCol = relMatch[2].trim();
          foreignKeys.push({
            column: fromCol,
            refTable: colType.replace("?", "").replace("[]", ""),
            refColumn: toCol,
          });
        }

        columns.push({
          name: colName,
          type: colType,
          isPrimary,
          isNullable,
          isUnique,
        });
      }
    }

    tables.push({
      name: tableName,
      columns,
      primaryKeys,
      foreignKeys,
      indexes: [],
    });
  }

  return tables;
}

/**
 * Parses SQL DDL statements (CREATE TABLE, CREATE INDEX, etc.)
 */
function parseSqlDdl(input: string): DdlTable[] {
  const tables: DdlTable[] = [];
  const cleaned = input.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // Match CREATE TABLE [IF NOT EXISTS] <name> ( ... )
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[a-zA-Z0-9_.]+[`"']?)\s*\(([\s\S]*?)\)(?:;|\s*$)/gi;
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(cleaned)) !== null) {
    const rawTableName = match[1].replace(/[`"']/g, "");
    const body = match[2];
    const columns: DdlColumn[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: DdlTable["foreignKeys"] = [];

    // Split definition clauses by top-level commas
    const clauses = splitSqlClauses(body);

    for (const clause of clauses) {
      const trimmed = clause.trim();
      if (!trimmed) continue;

      // Table-level PRIMARY KEY (col1, col2)
      const pkMatch = trimmed.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pks = pkMatch[1].split(",").map((s) => s.trim().replace(/[`"']/g, ""));
        primaryKeys.push(...pks);
        continue;
      }

      // Table-level FOREIGN KEY (col) REFERENCES other (refCol)
      const fkMatch = trimmed.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"']?[a-zA-Z0-9_.]+[`"']?)\s*\(([^)]+)\)/i);
      if (fkMatch) {
        const fromCol = fkMatch[1].trim().replace(/[`"']/g, "");
        const refTable = fkMatch[2].trim().replace(/[`"']/g, "");
        const refCol = fkMatch[3].trim().replace(/[`"']/g, "");
        foreignKeys.push({ column: fromCol, refTable, refColumn: refCol });
        continue;
      }

      // Standard Column definition: colName TYPE [CONSTRAINTS]
      const colTokens = trimmed.split(/\s+/);
      if (colTokens.length >= 2) {
        const colName = colTokens[0].replace(/[`"']/g, "");
        const colType = colTokens[1].toUpperCase();
        const upperClause = trimmed.toUpperCase();

        const isPrimary = upperClause.includes("PRIMARY KEY");
        const isNullable = !upperClause.includes("NOT NULL") && !isPrimary;
        const isUnique = upperClause.includes("UNIQUE");

        if (isPrimary && !primaryKeys.includes(colName)) {
          primaryKeys.push(colName);
        }

        // Inline REFERENCES other(col)
        let refInfo: DdlColumn["references"];
        const inlineRef = trimmed.match(/REFERENCES\s+([`"']?[a-zA-Z0-9_.]+[`"']?)\s*\(([^)]+)\)/i);
        if (inlineRef) {
          const refTable = inlineRef[1].replace(/[`"']/g, "");
          const refCol = inlineRef[2].replace(/[`"']/g, "");
          refInfo = { table: refTable, column: refCol };
          foreignKeys.push({ column: colName, refTable, refColumn: refCol });
        }

        columns.push({
          name: colName,
          type: colType,
          isPrimary,
          isNullable,
          isUnique,
          references: refInfo,
        });
      }
    }

    tables.push({
      name: rawTableName,
      columns,
      primaryKeys,
      foreignKeys,
      indexes: [],
    });
  }

  // Parse standalone CREATE INDEX statements
  const createIndexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[a-zA-Z0-9_]+[`"']?)\s+ON\s+([`"']?[a-zA-Z0-9_.]+[`"']?)\s*\(([^)]+)\)/gi;
  let idxMatch: RegExpExecArray | null;
  while ((idxMatch = createIndexRegex.exec(cleaned)) !== null) {
    const idxName = idxMatch[1].replace(/[`"']/g, "");
    const tblName = idxMatch[2].replace(/[`"']/g, "");
    const targetTable = tables.find((t) => t.name.toLowerCase() === tblName.toLowerCase());
    if (targetTable) {
      targetTable.indexes.push(idxName);
    }
  }

  return tables;
}

/**
 * Splits SQL clause strings respecting parentheses
 */
function splitSqlClauses(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;

    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * High-Level DDL Introspection function
 */
export function introspectDatabaseSchema(schemaInput: string): ParsedDatabaseSchema {
  if (!schemaInput || !schemaInput.trim()) {
    throw new Error("Schema input is empty. Paste SQL DDL or a Prisma schema.");
  }

  const dialect = detectSchemaDialect(schemaInput);
  const tables = dialect === "prisma" ? parsePrismaSchema(schemaInput) : parseSqlDdl(schemaInput);

  if (tables.length === 0) {
    throw new Error("No tables found. Ensure you provided valid 'CREATE TABLE' statements or Prisma 'model' definitions.");
  }

  let totalCols = 0;
  const relationships: ParsedDatabaseSchema["relationships"] = [];

  for (const t of tables) {
    totalCols += t.columns.length;
    for (const fk of t.foreignKeys) {
      relationships.push({
        fromTable: t.name,
        fromColumn: fk.column,
        toTable: fk.refTable,
        toColumn: fk.refColumn,
      });
    }
  }

  // Synthesize Directives & Safety Guardrails
  const synthesizedDirectives: string[] = [
    "- Zero Data Loss: Never execute destructive DDL (DROP TABLE, TRUNCATE, CASCADE) in automated agent scripts.",
    "- Safe Mutations: All UPDATE and DELETE queries MUST include an explicit, selective WHERE clause.",
    "- Transaction Integrity: Wrap multi-table inserts/updates in explicit atomic transactions (`BEGIN ... COMMIT`).",
    `- Index Consciousness: When querying on foreign keys (${tables
      .flatMap((t) => t.foreignKeys.map((f) => `${t.name}.${f.column}`))
      .slice(0, 3)
      .join(", ") || "references"}), verify covering indexes to prevent full table scans.`,
  ];

  if (dialect === "postgresql") {
    synthesizedDirectives.push("- Postgres Best Practices: Use TIMESTAMPTZ for timestamps and JSONB with GIN indexing for document fields.");
  } else if (dialect === "prisma") {
    synthesizedDirectives.push("- Prisma Client: Use selective `select` fields rather than querying full relations to eliminate over-fetching.");
  }

  // Synthesize Procedures
  const synthesizedProcedures: string[] = [
    "1. Schema Inspection: Inspect table definitions, column types, and foreign keys before writing SQL queries.",
    "2. Query Plan Verification: Run EXPLAIN ANALYZE on complex joins before committing production migrations.",
    "3. Migration Dry-Run: Test schema migrations locally in an isolated test database before production deployment.",
  ];

  const dialectLabel = dialect === "postgresql" ? "PostgreSQL" : dialect === "prisma" ? "Prisma ORM" : dialect === "sqlite" ? "SQLite" : "SQL";
  const synthesizedRole = `Senior ${dialectLabel} Database Architect & Performance Specialist`;
  const suggestedTitle = `${tables.length}-Table ${dialectLabel} Schema Guidelines`;

  return {
    dialect,
    tables,
    totalTables: tables.length,
    totalColumns: totalCols,
    relationships,
    synthesizedDirectives,
    synthesizedProcedures,
    synthesizedRole,
    suggestedTitle,
  };
}
