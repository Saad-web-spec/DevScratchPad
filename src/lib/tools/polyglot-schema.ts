/**
 * Polyglot schema generator.
 *
 * One shared inference core turns a parsed JSON value into a merged type model
 * (every array element and every object sample is merged, so fields missing in
 * some samples become optional). Five emitters then render that single model as
 * TypeScript, Zod, Go, Python (Pydantic v2) or Rust (serde) declarations, so
 * type names and optionality stay consistent across languages.
 */

export type TargetLanguage = "typescript" | "zod" | "go" | "python" | "rust";

// ---------------------------------------------------------------------------
// 1. Inference: JSON value -> merged TypeInfo
// ---------------------------------------------------------------------------

interface TypeInfo {
  nullable: boolean;
  bool?: true;
  int?: true;
  float?: true;
  string?: true;
  /** Merged element type; an empty TypeInfo for `[]`. */
  array?: TypeInfo;
  object?: ObjectInfo;
}

interface FieldInfo {
  type: TypeInfo;
  /** Number of object samples that contained this key. */
  count: number;
}

interface ObjectInfo {
  fields: Map<string, FieldInfo>;
  /** Number of object values merged into this ObjectInfo. */
  samples: number;
}

/** Integers at or beyond 2^63 cannot be stored in i64/int64, so they are treated as floats. */
const INT64_LIMIT = 2 ** 63;

function emptyType(): TypeInfo {
  return { nullable: false };
}

/** Merges one JSON value into an accumulated TypeInfo (mutates `target`). */
function observe(target: TypeInfo, value: unknown): void {
  if (value === null || value === undefined) {
    target.nullable = true;
    return;
  }
  switch (typeof value) {
    case "string":
      target.string = true;
      return;
    case "boolean":
      target.bool = true;
      return;
    case "number":
      if (Number.isInteger(value) && Math.abs(value) < INT64_LIMIT) target.int = true;
      else target.float = true;
      return;
    case "object": {
      if (Array.isArray(value)) {
        const element = target.array ?? (target.array = emptyType());
        for (const item of value) observe(element, item);
        return;
      }
      const info = target.object ?? (target.object = { fields: new Map(), samples: 0 });
      info.samples += 1;
      const record = value as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        let field = info.fields.get(key);
        if (!field) {
          field = { type: emptyType(), count: 0 };
          info.fields.set(key, field);
        }
        field.count += 1;
        observe(field.type, record[key]);
      }
      return;
    }
    default:
      // bigint / function / symbol never come out of JSON.parse; they stay "unknown".
      return;
  }
}

/** Canonical structural signatures, interned to small integers so parents hash in O(fields). */
class Signer {
  private readonly interned = new Map<string, number>();
  private readonly typeIds = new Map<TypeInfo, number>();
  private readonly objectIds = new Map<ObjectInfo, number>();

  private intern(key: string): number {
    const found = this.interned.get(key);
    if (found !== undefined) return found;
    const id = this.interned.size;
    this.interned.set(key, id);
    return id;
  }

  ofType(type: TypeInfo): number {
    const cached = this.typeIds.get(type);
    if (cached !== undefined) return cached;
    let key = `${type.nullable ? "n" : ""}${type.bool ? "b" : ""}${type.float ? "f" : type.int ? "i" : ""}${type.string ? "s" : ""}`;
    if (type.array) key += `a${this.ofType(type.array)}`;
    if (type.object) key += `o${this.ofObject(type.object)}`;
    const id = this.intern(key);
    this.typeIds.set(type, id);
    return id;
  }

  ofObject(object: ObjectInfo): number {
    const cached = this.objectIds.get(object);
    if (cached !== undefined) return cached;
    const parts: string[] = [];
    for (const [key, field] of object.fields) {
      parts.push(`${JSON.stringify(key)}${field.count < object.samples ? "?" : ":"}${this.ofType(field.type)}`);
    }
    parts.sort();
    const id = this.intern(`{${parts.join(",")}}`);
    this.objectIds.set(object, id);
    return id;
  }
}

// ---------------------------------------------------------------------------
// 2. Lowering: TypeInfo -> named declarations shared by every emitter
// ---------------------------------------------------------------------------

type ScalarKind = "unknown" | "null" | "bool" | "int" | "float" | "string" | "record";

type Shape =
  | { kind: ScalarKind }
  | { kind: "array"; element: TypeRef }
  | { kind: "ref"; name: string }
  | { kind: "union"; members: Shape[] };

interface TypeRef {
  shape: Shape;
  nullable: boolean;
}

interface FieldDecl {
  key: string;
  type: TypeRef;
  optional: boolean;
}

interface ObjectDecl {
  name: string;
  fields: FieldDecl[];
}

interface AliasDecl {
  name: string;
  type: TypeRef;
}

interface SchemaModel {
  /** Root first, then nested declarations in pre-order discovery. */
  preOrder: ObjectDecl[];
  /** Dependencies first, root last. */
  postOrder: ObjectDecl[];
  /** Root alias (root arrays, primitives and `{}`); absent when the root is a named object. */
  alias?: AliasDecl;
}

/**
 * Type names that would shadow identifiers the generated code relies on
 * (Python typing/pydantic imports and literals, Rust prelude/serde, TS `Record`).
 */
const RESERVED_TYPE_NAMES: ReadonlySet<string> = new Set([
  "Any", "Dict", "List", "Optional", "Union", "BaseModel", "Field", "None", "True", "False",
  "Option", "Vec", "String", "Box", "Result", "Some", "Ok", "Err", "Self",
  "Serialize", "Deserialize", "Debug", "Clone", "Record",
]);

/** Splits a JSON key into words on non-alphanumerics and camelCase / acronym boundaries. */
function splitWords(key: string): string[] {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 0);
}

function pascalCase(raw: string): string {
  // SCREAMING_SNAKE keys read better as UserData than USERDATA.
  const screaming = /[^A-Za-z0-9]/.test(raw) && !/[a-z]/.test(raw);
  return splitWords(screaming ? raw.toLowerCase() : raw)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

const INVARIANT_PLURALS = ["series", "species", "news"];

/** Deliberately simple English singularization for array element type names. */
function singularize(word: string): string {
  const lower = word.toLowerCase();
  if (INVARIANT_PLURALS.some((plural) => lower.endsWith(plural))) return word;
  if (lower.length > 3 && lower.endsWith("ies")) return `${word.slice(0, -3)}${word.endsWith("IES") ? "Y" : "y"}`;
  // addresses, boxes, matches, dishes, statuses/bonuses (but causes/houses keep their "e")
  if (/(?:ss|x|ch|sh|[^aeiou]us)es$/.test(lower)) return word.slice(0, -2);
  if (lower.length > 1 && lower.endsWith("s") && !/(?:ss|us|is)$/.test(lower)) return word.slice(0, -1);
  return word;
}

/** Makes a candidate type name a valid identifier in all five target languages. */
function toTypeName(raw: string): string {
  const name = raw.replace(/[^A-Za-z0-9]/g, "");
  if (!name) return "Item";
  return /^[0-9]/.test(name) ? `T${name}` : name;
}

class Lowerer {
  readonly preOrder: ObjectDecl[] = [];
  readonly postOrder: ObjectDecl[] = [];
  private readonly used = new Set<string>(RESERVED_TYPE_NAMES);
  private readonly nameBySignature = new Map<number, string>();
  private readonly signer = new Signer();

  /** Reserves a unique type name: Name, then ParentName+Name, then Name2, Name3, ... */
  allocate(rawBase: string, parent: string | null): string {
    const base = toTypeName(rawBase);
    const candidates = parent ? [base, `${parent}${base}`] : [base];
    for (const candidate of candidates) {
      if (!this.used.has(candidate)) {
        this.used.add(candidate);
        return candidate;
      }
    }
    for (let suffix = 2; ; suffix++) {
      const candidate = `${base}${suffix}`;
      if (!this.used.has(candidate)) {
        this.used.add(candidate);
        return candidate;
      }
    }
  }

  /**
   * @param hint name for an object found directly at this position
   * @param elementHint name for objects found inside arrays at this position
   * @param parent name of the declaration that owns this position (for collisions)
   */
  lower(type: TypeInfo, hint: string, elementHint: string, parent: string | null): TypeRef {
    const variants: Shape[] = [];
    if (type.string) variants.push({ kind: "string" });
    if (type.float) variants.push({ kind: "float" });
    else if (type.int) variants.push({ kind: "int" });
    if (type.bool) variants.push({ kind: "bool" });
    if (type.array) variants.push({ kind: "array", element: this.lower(type.array, elementHint, elementHint, parent) });
    if (type.object) variants.push(this.lowerObject(type.object, hint, parent));

    if (variants.length === 0) return { shape: { kind: type.nullable ? "null" : "unknown" }, nullable: false };
    if (variants.length === 1) return { shape: variants[0], nullable: type.nullable };
    return { shape: { kind: "union", members: variants }, nullable: type.nullable };
  }

  private lowerObject(object: ObjectInfo, hint: string, parent: string | null): Shape {
    if (object.fields.size === 0) return { kind: "record" };

    const signature = this.signer.ofObject(object);
    const existing = this.nameBySignature.get(signature);
    if (existing !== undefined) return { kind: "ref", name: existing };

    const name = this.allocate(hint, parent);
    this.nameBySignature.set(signature, name);
    const decl: ObjectDecl = { name, fields: [] };
    this.preOrder.push(decl);
    for (const [key, field] of object.fields) {
      const fieldHint = pascalCase(key);
      decl.fields.push({
        key,
        optional: field.count < object.samples,
        type: this.lower(field.type, fieldHint, singularize(fieldHint), name),
      });
    }
    this.postOrder.push(decl);
    return { kind: "ref", name };
  }
}

function buildModel(value: unknown, rootName: string): SchemaModel {
  const info = emptyType();
  observe(info, value);

  const rootBase = pascalCase(rootName);
  const root = rootBase ? toTypeName(rootBase) : "Root";
  const lowerer = new Lowerer();

  if (Array.isArray(value)) {
    const aliasName = lowerer.allocate(`${root}List`, null);
    const element = lowerer.lower(info.array ?? emptyType(), root, root, null);
    return {
      preOrder: lowerer.preOrder,
      postOrder: lowerer.postOrder,
      alias: { name: aliasName, type: { shape: { kind: "array", element }, nullable: false } },
    };
  }

  const rootRef = lowerer.lower(info, root, root, null);
  if (rootRef.shape.kind === "ref" && !rootRef.nullable) {
    return { preOrder: lowerer.preOrder, postOrder: lowerer.postOrder };
  }
  return {
    preOrder: lowerer.preOrder,
    postOrder: lowerer.postOrder,
    alias: { name: lowerer.allocate(root, null), type: rootRef },
  };
}

// ---------------------------------------------------------------------------
// 3. Emitters
// ---------------------------------------------------------------------------

const JS_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function jsPropertyKey(key: string): string {
  return JS_IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

function uniqueName(name: string, used: Set<string>, separator: string): string {
  let candidate = name;
  for (let suffix = 2; used.has(candidate); suffix++) candidate = `${name}${separator}${suffix}`;
  used.add(candidate);
  return candidate;
}

/** snake_case field name; invalid leading digits get a `field_` prefix. */
function snakeName(key: string): string {
  const name = splitWords(key)
    .map((word) => word.toLowerCase())
    .join("_");
  if (!name) return "field";
  return /^[0-9]/.test(name) ? `field_${name}` : name;
}

// --- TypeScript -------------------------------------------------------------

function tsType(ref: TypeRef): string {
  const base = tsShape(ref.shape);
  return ref.nullable ? `${base} | null` : base;
}

function tsShape(shape: Shape): string {
  switch (shape.kind) {
    case "unknown":
      return "unknown";
    case "null":
      return "null";
    case "bool":
      return "boolean";
    case "int":
    case "float":
      return "number";
    case "string":
      return "string";
    case "record":
      return "Record<string, unknown>";
    case "ref":
      return shape.name;
    case "array": {
      const inner = tsType(shape.element);
      const compound = shape.element.nullable || shape.element.shape.kind === "union";
      return compound ? `(${inner})[]` : `${inner}[]`;
    }
    case "union":
      return shape.members.map(tsShape).join(" | ");
  }
}

function emitTypeScript(model: SchemaModel): string {
  const blocks: string[] = [];
  if (model.alias) blocks.push(`export type ${model.alias.name} = ${tsType(model.alias.type)};`);
  for (const decl of model.preOrder) {
    const lines = decl.fields.map(
      (field) => `  ${jsPropertyKey(field.key)}${field.optional ? "?" : ""}: ${tsType(field.type)};`
    );
    blocks.push(`export interface ${decl.name} {\n${lines.join("\n")}\n}`);
  }
  return blocks.join("\n\n");
}

// --- Zod --------------------------------------------------------------------

function zodType(ref: TypeRef): string {
  const base = zodShape(ref.shape);
  return ref.nullable ? `${base}.nullable()` : base;
}

function zodShape(shape: Shape): string {
  switch (shape.kind) {
    case "unknown":
      return "z.unknown()";
    case "null":
      return "z.null()";
    case "bool":
      return "z.boolean()";
    case "int":
      return "z.number().int()";
    case "float":
      return "z.number()";
    case "string":
      return "z.string()";
    case "record":
      return "z.record(z.string(), z.unknown())";
    case "ref":
      return `${shape.name}Schema`;
    case "array":
      return `z.array(${zodType(shape.element)})`;
    case "union":
      return `z.union([${shape.members.map(zodShape).join(", ")}])`;
  }
}

function zodDeclaration(name: string, schema: string): string {
  return `export const ${name}Schema = ${schema};\nexport type ${name} = z.infer<typeof ${name}Schema>;`;
}

function emitZod(model: SchemaModel): string {
  const blocks = model.postOrder.map((decl) => {
    const lines = decl.fields.map(
      (field) => `  ${jsPropertyKey(field.key)}: ${zodType(field.type)}${field.optional ? ".optional()" : ""},`
    );
    return zodDeclaration(decl.name, `z.object({\n${lines.join("\n")}\n})`);
  });
  if (model.alias) blocks.push(zodDeclaration(model.alias.name, zodType(model.alias.type)));
  return `import { z } from "zod";\n\n${blocks.join("\n\n")}`;
}

// --- Go ---------------------------------------------------------------------

const GO_INITIALISMS: ReadonlySet<string> = new Set([
  "id", "url", "uri", "api", "http", "https", "json", "xml", "html", "css", "sql", "uuid", "ip",
  "tcp", "udp", "tls", "ttl", "cpu", "utc", "dns", "ssh", "eof", "acl", "ui", "uid",
]);

function goWord(word: string): string {
  const lower = word.toLowerCase();
  if (GO_INITIALISMS.has(lower)) return lower.toUpperCase();
  // ids -> IDs, urls -> URLs
  if (lower.length > 2 && lower.endsWith("s") && GO_INITIALISMS.has(lower.slice(0, -1))) {
    return `${lower.slice(0, -1).toUpperCase()}s`;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function goFieldName(key: string): string {
  const name = splitWords(key).map(goWord).join("");
  if (!name) return "Field";
  return /^[0-9]/.test(name) ? `Field${name}` : name;
}

const GO_SCALARS: Readonly<Record<"bool" | "int" | "float" | "string", string>> = {
  bool: "bool",
  int: "int64",
  float: "float64",
  string: "string",
};

function goType(ref: TypeRef, optional: boolean): string {
  const shape = ref.shape;
  switch (shape.kind) {
    case "unknown":
    case "null":
    case "union":
      return "any";
    case "record":
      return "map[string]any";
    case "array":
      return `[]${goType(shape.element, false)}`;
    case "ref":
      // omitempty is a no-op on struct values, so optional structs are pointers too.
      return `${ref.nullable || optional ? "*" : ""}${shape.name}`;
    case "bool":
    case "int":
    case "float":
    case "string":
      return `${ref.nullable ? "*" : ""}${GO_SCALARS[shape.kind]}`;
  }
}

function goTag(key: string, optional: boolean): string {
  const tag = `json:${JSON.stringify(optional ? `${key},omitempty` : key)}`;
  // A raw string literal cannot contain a backtick; fall back to an interpreted literal.
  return tag.includes("`") ? JSON.stringify(tag) : `\`${tag}\``;
}

function emitGoStruct(decl: ObjectDecl): string {
  const used = new Set<string>();
  const rows = decl.fields.map((field) => ({
    name: uniqueName(goFieldName(field.key), used, ""),
    type: goType(field.type, field.optional),
    tag: goTag(field.key, field.optional),
  }));
  const nameWidth = Math.max(...rows.map((row) => row.name.length));
  const typeWidth = Math.max(...rows.map((row) => row.type.length));
  const lines = rows.map((row) => `\t${row.name.padEnd(nameWidth)} ${row.type.padEnd(typeWidth)} ${row.tag}`);
  return `type ${decl.name} struct {\n${lines.join("\n")}\n}`;
}

function emitGo(model: SchemaModel): string {
  const blocks: string[] = [];
  if (model.alias) blocks.push(`type ${model.alias.name} ${goType(model.alias.type, false)}`);
  for (const decl of model.preOrder) blocks.push(emitGoStruct(decl));
  return blocks.join("\n\n");
}

// --- Python (Pydantic v2) ---------------------------------------------------

const PYTHON_RESERVED: ReadonlySet<string> = new Set([
  // keywords
  "false", "none", "true", "and", "as", "assert", "async", "await", "break", "class", "continue",
  "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in",
  "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
  // builtins used in annotations (a defaulted field named `str` would rebind it in the class body)
  "str", "int", "float", "bool",
  // BaseModel attributes that a field must not shadow
  "model_config", "model_fields", "model_computed_fields", "json", "dict", "copy", "schema",
  "schema_json", "construct", "validate", "parse_obj", "parse_raw", "parse_file", "from_orm",
  "update_forward_refs",
]);

interface PythonImports {
  typing: Set<string>;
  baseModel: boolean;
  field: boolean;
}

function pyType(ref: TypeRef, imports: PythonImports): string {
  const base = pyShape(ref.shape, imports);
  if (!ref.nullable) return base;
  imports.typing.add("Optional");
  return `Optional[${base}]`;
}

function pyShape(shape: Shape, imports: PythonImports): string {
  switch (shape.kind) {
    case "unknown":
      imports.typing.add("Any");
      return "Any";
    case "null":
      imports.typing.add("Optional").add("Any");
      return "Optional[Any]";
    case "bool":
      return "bool";
    case "int":
      return "int";
    case "float":
      return "float";
    case "string":
      return "str";
    case "record":
      imports.typing.add("Dict").add("Any");
      return "Dict[str, Any]";
    case "ref":
      return shape.name;
    case "array":
      imports.typing.add("List");
      return `List[${pyType(shape.element, imports)}]`;
    case "union":
      imports.typing.add("Union");
      return `Union[${shape.members.map((member) => pyShape(member, imports)).join(", ")}]`;
  }
}

function pyField(field: FieldDecl, used: Set<string>, imports: PythonImports): string {
  const snake = snakeName(field.key);
  const name = uniqueName(PYTHON_RESERVED.has(snake) ? `${snake}_` : snake, used, "_");
  const alias = name !== field.key ? JSON.stringify(field.key) : null;
  if (alias) imports.field = true;

  let annotation = pyType(field.type, imports);
  let defaultValue: string | null = alias ? `Field(alias=${alias})` : null;
  if (field.optional) {
    const kind = field.type.shape.kind;
    if (!field.type.nullable && kind !== "null" && kind !== "unknown") {
      imports.typing.add("Optional");
      annotation = `Optional[${annotation}]`;
    }
    defaultValue = alias ? `Field(default=None, alias=${alias})` : "None";
  }
  return `    ${name}: ${annotation}${defaultValue ? ` = ${defaultValue}` : ""}`;
}

function emitPython(model: SchemaModel): string {
  const imports: PythonImports = { typing: new Set(), baseModel: false, field: false };
  const blocks = model.postOrder.map((decl) => {
    imports.baseModel = true;
    const used = new Set<string>();
    const lines = decl.fields.map((field) => pyField(field, used, imports));
    return `class ${decl.name}(BaseModel):\n${lines.length > 0 ? lines.join("\n") : "    pass"}`;
  });
  if (model.alias) blocks.push(`${model.alias.name} = ${pyType(model.alias.type, imports)}`);

  const header: string[] = [];
  if (imports.typing.size > 0) header.push(`from typing import ${[...imports.typing].sort().join(", ")}`);
  if (imports.baseModel) header.push(`from pydantic import BaseModel${imports.field ? ", Field" : ""}`);
  return [...header, ...blocks].join("\n\n");
}

// --- Rust (serde) -----------------------------------------------------------

const RUST_KEYWORDS: ReadonlySet<string> = new Set([
  "as", "async", "await", "break", "const", "continue", "crate", "dyn", "else", "enum", "extern",
  "false", "fn", "for", "gen", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub",
  "ref", "return", "self", "static", "struct", "super", "trait", "true", "try", "type", "unsafe",
  "use", "where", "while", "abstract", "become", "box", "do", "final", "macro", "override", "priv",
  "typeof", "unsized", "virtual", "yield",
]);

const RUST_VALUE = "serde_json::Value";

function rustType(ref: TypeRef): string {
  if (ref.shape.kind === "null") return `Option<${RUST_VALUE}>`;
  const base = rustShape(ref.shape);
  return ref.nullable ? `Option<${base}>` : base;
}

function rustShape(shape: Shape): string {
  switch (shape.kind) {
    case "unknown":
    case "null":
    case "union":
    case "record":
      return RUST_VALUE;
    case "bool":
      return "bool";
    case "int":
      return "i64";
    case "float":
      return "f64";
    case "string":
      return "String";
    case "ref":
      return shape.name;
    case "array":
      return `Vec<${rustType(shape.element)}>`;
  }
}

/** Rust string literal (JSON escapes like \b and \uXXXX are not valid Rust). */
function rustString(value: string): string {
  let out = '"';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (char === '"') out += '\\"';
    else if (char === "\\") out += "\\\\";
    else if (char === "\n") out += "\\n";
    else if (char === "\r") out += "\\r";
    else if (char === "\t") out += "\\t";
    else if (code < 0x20 || code === 0x7f) out += `\\u{${code.toString(16)}}`;
    else out += char;
  }
  return `${out}"`;
}

function emitRustStruct(decl: ObjectDecl): string {
  const used = new Set<string>();
  const lines: string[] = [];
  for (const field of decl.fields) {
    const snake = snakeName(field.key);
    const name = uniqueName(RUST_KEYWORDS.has(snake) ? `${snake}_` : snake, used, "_");
    let type = rustType(field.type);
    if (field.optional && !type.startsWith("Option<")) type = `Option<${type}>`;
    if (name !== field.key) lines.push(`    #[serde(rename = ${rustString(field.key)})]`);
    lines.push(`    pub ${name}: ${type},`);
  }
  return `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${decl.name} {\n${lines.join("\n")}\n}`;
}

function emitRust(model: SchemaModel): string {
  const blocks: string[] = [];
  if (model.preOrder.length > 0) blocks.push("use serde::{Deserialize, Serialize};");
  if (model.alias) blocks.push(`pub type ${model.alias.name} = ${rustType(model.alias.type)};`);
  for (const decl of model.preOrder) blocks.push(emitRustStruct(decl));
  return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// 4. Public API
// ---------------------------------------------------------------------------

const EMITTERS: Readonly<Record<TargetLanguage, (model: SchemaModel) => string>> = {
  typescript: emitTypeScript,
  zod: emitZod,
  go: emitGo,
  python: emitPython,
  rust: emitRust,
};

/** Converts an already-parsed JSON value into type definitions for `targetLang`. */
export function convertValueToSchema(value: unknown, targetLang: TargetLanguage, rootName: string = "Root"): string {
  const emit = EMITTERS[targetLang];
  if (!emit) return "";
  return emit(buildModel(value, rootName ?? "Root"));
}

/** Parses `jsonStr` and converts it. Returns "" for blank input; throws on invalid JSON. */
export function convertJsonToSchema(
  jsonStr: string,
  targetLang: TargetLanguage = "typescript",
  rootName: string = "Root"
): string {
  if (!jsonStr || jsonStr.trim() === "") return "";
  return convertValueToSchema(JSON.parse(jsonStr) as unknown, targetLang, rootName);
}

// Thin compatibility wrappers (value is already parsed).
export function jsonToZod(value: unknown, rootName: string = "Root"): string {
  return convertValueToSchema(value, "zod", rootName);
}

export function jsonToGo(value: unknown, rootName: string = "Root"): string {
  return convertValueToSchema(value, "go", rootName);
}

export function jsonToPydantic(value: unknown, rootName: string = "Root"): string {
  return convertValueToSchema(value, "python", rootName);
}

export function jsonToRust(value: unknown, rootName: string = "Root"): string {
  return convertValueToSchema(value, "rust", rootName);
}
