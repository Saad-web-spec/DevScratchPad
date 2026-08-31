import JsonToTS from "json-to-ts";

export type TargetLanguage = "typescript" | "zod" | "go" | "python" | "rust";

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[a-z]/, (chr) => chr.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/[^a-z0-9_]+/g, "_");
}

// 1. Zod Schema Generator
export function jsonToZod(parsed: any, rootName: string = "Root"): string {
  const schemas: { name: string; code: string }[] = [];

  function generateSchema(value: any, name: string): string {
    if (value === null) return "z.null()";
    if (typeof value === "string") return "z.string()";
    if (typeof value === "number") return Number.isInteger(value) ? "z.number().int()" : "z.number()";
    if (typeof value === "boolean") return "z.boolean()";

    if (Array.isArray(value)) {
      if (value.length === 0) return "z.array(z.unknown())";
      const sample = value[0];
      const itemSchema = generateSchema(sample, `${name}Item`);
      return `z.array(${itemSchema})`;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) return "z.record(z.unknown())";

      const fields = keys.map((key) => {
        const val = value[key];
        const fieldSchemaName = toPascalCase(`${name}_${key}`);
        let fieldType: string;

        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          generateSchema(val, fieldSchemaName);
          fieldType = `${fieldSchemaName}Schema`;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
          const itemSchemaName = toPascalCase(`${name}_${key}_Item`);
          generateSchema(val[0], itemSchemaName);
          fieldType = `z.array(${itemSchemaName}Schema)`;
        } else {
          fieldType = generateSchema(val, fieldSchemaName);
        }

        return `  ${JSON.stringify(key)}: ${fieldType},`;
      });

      const schemaCode = `export const ${name}Schema = z.object({\n${fields.join("\n")}\n});\nexport type ${name} = z.infer<typeof ${name}Schema>;`;
      schemas.push({ name, code: schemaCode });
      return `${name}Schema`;
    }

    return "z.unknown()";
  }

  generateSchema(parsed, rootName);
  return `import { z } from "zod";\n\n` + schemas.map((s) => s.code).join("\n\n");
}

// 2. Go Struct Generator
export function jsonToGo(parsed: any, rootName: string = "Root"): string {
  const structs: { name: string; code: string }[] = [];

  function generateStruct(value: any, name: string): string {
    if (value === null) return "interface{}";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return Number.isInteger(value) ? "int64" : "float64";
    if (typeof value === "boolean") return "bool";

    if (Array.isArray(value)) {
      if (value.length === 0) return "[]interface{}";
      const itemType = generateStruct(value[0], `${name}Item`);
      return `[]${itemType}`;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      const fields = keys.map((key) => {
        const val = value[key];
        const fieldPascal = toPascalCase(key);
        let fieldType: string;

        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          const nestedStructName = toPascalCase(`${name}_${key}`);
          generateStruct(val, nestedStructName);
          fieldType = nestedStructName;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
          const itemStructName = toPascalCase(`${name}_${key}_Item`);
          generateStruct(val[0], itemStructName);
          fieldType = `[]${itemStructName}`;
        } else {
          fieldType = generateStruct(val, fieldPascal);
        }

        return `\t${fieldPascal} ${fieldType} \`json:"${key}"\``;
      });

      const structCode = `type ${name} struct {\n${fields.join("\n")}\n}`;
      structs.push({ name, code: structCode });
      return name;
    }

    return "interface{}";
  }

  generateStruct(parsed, rootName);
  return structs.map((s) => s.code).join("\n\n");
}

// 3. Python Pydantic Model (v2)
export function jsonToPydantic(parsed: any, rootName: string = "Root"): string {
  const models: { name: string; code: string }[] = [];

  function generateModel(value: any, name: string): string {
    if (value === null) return "Optional[Any]";
    if (typeof value === "string") return "str";
    if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
    if (typeof value === "boolean") return "bool";

    if (Array.isArray(value)) {
      if (value.length === 0) return "List[Any]";
      const itemType = generateModel(value[0], `${name}Item`);
      return `List[${itemType}]`;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      const fields = keys.map((key) => {
        const val = value[key];
        const fieldSnake = toSnakeCase(key);
        let fieldType: string;

        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          const nestedModelName = toPascalCase(`${name}_${key}`);
          generateModel(val, nestedModelName);
          fieldType = nestedModelName;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
          const itemModelName = toPascalCase(`${name}_${key}_Item`);
          generateModel(val[0], itemModelName);
          fieldType = `List[${itemModelName}]`;
        } else {
          fieldType = generateModel(val, `${name}_${key}`);
        }

        if (fieldSnake !== key) {
          return `    ${fieldSnake}: ${fieldType} = Field(..., alias="${key}")`;
        }
        return `    ${fieldSnake}: ${fieldType}`;
      });

      const modelCode = `class ${name}(BaseModel):\n${fields.length > 0 ? fields.join("\n") : "    pass"}`;
      models.push({ name, code: modelCode });
      return name;
    }

    return "Any";
  }

  generateModel(parsed, rootName);
  return (
    `from pydantic import BaseModel, Field\nfrom typing import List, Optional, Any, Dict\n\n` +
    models.map((m) => m.code).join("\n\n")
  );
}

// 4. Rust Serde Struct
export function jsonToRust(parsed: any, rootName: string = "Root"): string {
  const structs: { name: string; code: string }[] = [];

  function generateRustStruct(value: any, name: string): string {
    if (value === null) return "Option<serde_json::Value>";
    if (typeof value === "string") return "String";
    if (typeof value === "number") return Number.isInteger(value) ? "i64" : "f64";
    if (typeof value === "boolean") return "bool";

    if (Array.isArray(value)) {
      if (value.length === 0) return "Vec<serde_json::Value>";
      const itemType = generateRustStruct(value[0], `${name}Item`);
      return `Vec<${itemType}>`;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      const fields = keys.map((key) => {
        const val = value[key];
        const fieldSnake = toSnakeCase(key);
        let fieldType: string;

        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          const nestedStructName = toPascalCase(`${name}_${key}`);
          generateRustStruct(val, nestedStructName);
          fieldType = nestedStructName;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
          const itemStructName = toPascalCase(`${name}_${key}_Item`);
          generateRustStruct(val[0], itemStructName);
          fieldType = `Vec<${itemStructName}>`;
        } else {
          fieldType = generateRustStruct(val, `${name}_${key}`);
        }

        if (fieldSnake !== key) {
          return `    #[serde(rename = "${key}")]\n    pub ${fieldSnake}: ${fieldType},`;
        }
        return `    pub ${fieldSnake}: ${fieldType},`;
      });

      const structCode = `#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]\npub struct ${name} {\n${fields.join("\n")}\n}`;
      structs.push({ name, code: structCode });
      return name;
    }

    return "serde_json::Value";
  }

  generateRustStruct(parsed, rootName);
  return `use serde::{Serialize, Deserialize};\n\n` + structs.map((s) => s.code).join("\n\n");
}

// Master Polyglot Converter
export function convertJsonToSchema(
  jsonStr: string,
  targetLang: TargetLanguage = "typescript",
  rootName: string = "RootObject"
): string {
  if (!jsonStr || jsonStr.trim() === "") return "";
  const parsed = JSON.parse(jsonStr);
  const validRoot = rootName && rootName.trim() ? toPascalCase(rootName.trim()) : "RootObject";

  switch (targetLang) {
    case "typescript": {
      const interfaces = JsonToTS(parsed, { rootName: validRoot });
      return interfaces.join("\n\n");
    }
    case "zod":
      return jsonToZod(parsed, validRoot);
    case "go":
      return jsonToGo(parsed, validRoot);
    case "python":
      return jsonToPydantic(parsed, validRoot);
    case "rust":
      return jsonToRust(parsed, validRoot);
    default:
      return "";
  }
}
