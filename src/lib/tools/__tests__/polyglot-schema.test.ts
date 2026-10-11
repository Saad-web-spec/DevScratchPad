import { describe, expect, it } from "vitest";
import { convertJsonToSchema, convertValueToSchema, type TargetLanguage } from "@/lib/tools/polyglot-schema";
import { jsonToTs, validateJsonForTs } from "@/lib/tools/json-to-ts";

const ALL_LANGUAGES: TargetLanguage[] = ["typescript", "zod", "go", "python", "rust"];

const SAMPLE = {
  id: 1,
  name: "Ann",
  address: { city: "X", geo: { lat: 1.5 } },
  tags: ["a"],
  posts: [
    { id: 1, title: "t" },
    { id: 2, title: "u", draft: true },
  ],
  meta: {},
  nickname: null,
};

describe("convertValueToSchema: nested objects and merged arrays", () => {
  it("emits TypeScript interfaces root-first with optional fields from later array elements", () => {
    expect(convertValueToSchema(SAMPLE, "typescript", "User")).toBe(
      [
        "export interface User {",
        "  id: number;",
        "  name: string;",
        "  address: Address;",
        "  tags: string[];",
        "  posts: Post[];",
        "  meta: Record<string, unknown>;",
        "  nickname: null;",
        "}",
        "",
        "export interface Address {",
        "  city: string;",
        "  geo: Geo;",
        "}",
        "",
        "export interface Geo {",
        "  lat: number;",
        "}",
        "",
        "export interface Post {",
        "  id: number;",
        "  title: string;",
        "  draft?: boolean;",
        "}",
      ].join("\n")
    );
  });

  it("emits Zod schemas dependencies-first with the root last", () => {
    expect(convertValueToSchema(SAMPLE, "zod", "User")).toBe(
      [
        'import { z } from "zod";',
        "",
        "export const GeoSchema = z.object({",
        "  lat: z.number(),",
        "});",
        "export type Geo = z.infer<typeof GeoSchema>;",
        "",
        "export const AddressSchema = z.object({",
        "  city: z.string(),",
        "  geo: GeoSchema,",
        "});",
        "export type Address = z.infer<typeof AddressSchema>;",
        "",
        "export const PostSchema = z.object({",
        "  id: z.number().int(),",
        "  title: z.string(),",
        "  draft: z.boolean().optional(),",
        "});",
        "export type Post = z.infer<typeof PostSchema>;",
        "",
        "export const UserSchema = z.object({",
        "  id: z.number().int(),",
        "  name: z.string(),",
        "  address: AddressSchema,",
        "  tags: z.array(z.string()),",
        "  posts: z.array(PostSchema),",
        "  meta: z.record(z.string(), z.unknown()),",
        "  nickname: z.null(),",
        "});",
        "export type User = z.infer<typeof UserSchema>;",
      ].join("\n")
    );
  });

  it("emits gofmt-aligned Go structs", () => {
    expect(convertValueToSchema(SAMPLE, "go", "User")).toBe(
      [
        "type User struct {",
        "\tID       int64          `json:\"id\"`",
        "\tName     string         `json:\"name\"`",
        "\tAddress  Address        `json:\"address\"`",
        "\tTags     []string       `json:\"tags\"`",
        "\tPosts    []Post         `json:\"posts\"`",
        "\tMeta     map[string]any `json:\"meta\"`",
        "\tNickname any            `json:\"nickname\"`",
        "}",
        "",
        "type Address struct {",
        "\tCity string `json:\"city\"`",
        "\tGeo  Geo    `json:\"geo\"`",
        "}",
        "",
        "type Geo struct {",
        "\tLat float64 `json:\"lat\"`",
        "}",
        "",
        "type Post struct {",
        "\tID    int64  `json:\"id\"`",
        "\tTitle string `json:\"title\"`",
        "\tDraft bool   `json:\"draft,omitempty\"`",
        "}",
      ].join("\n")
    );
  });

  it("emits Pydantic models dependencies-first with only the imports used", () => {
    expect(convertValueToSchema(SAMPLE, "python", "User")).toBe(
      [
        "from typing import Any, Dict, List, Optional",
        "",
        "from pydantic import BaseModel",
        "",
        "class Geo(BaseModel):",
        "    lat: float",
        "",
        "class Address(BaseModel):",
        "    city: str",
        "    geo: Geo",
        "",
        "class Post(BaseModel):",
        "    id: int",
        "    title: str",
        "    draft: Optional[bool] = None",
        "",
        "class User(BaseModel):",
        "    id: int",
        "    name: str",
        "    address: Address",
        "    tags: List[str]",
        "    posts: List[Post]",
        "    meta: Dict[str, Any]",
        "    nickname: Optional[Any]",
      ].join("\n")
    );
  });

  it("emits serde structs with Option for optional and nullable fields", () => {
    const rust = convertValueToSchema(SAMPLE, "rust", "User");
    expect(rust.startsWith("use serde::{Deserialize, Serialize};\n\n#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct User {\n")).toBe(true);
    expect(rust).toContain("    pub meta: serde_json::Value,\n    pub nickname: Option<serde_json::Value>,\n}");
    expect(rust).toContain(
      "pub struct Post {\n    pub id: i64,\n    pub title: String,\n    pub draft: Option<bool>,\n}"
    );
    expect(rust).toContain("pub struct Geo {\n    pub lat: f64,\n}");
  });

  it("never leaves trailing whitespace and separates declarations by one blank line", () => {
    for (const lang of ALL_LANGUAGES) {
      const out = convertValueToSchema(SAMPLE, lang, "User");
      expect(out).not.toMatch(/[ \t]+$/m);
      expect(out).not.toMatch(/\n{3,}/);
      expect(out.endsWith("\n")).toBe(false);
    }
  });
});

describe("convertValueToSchema: mixed arrays and nulls", () => {
  const mixed = { mixed: ["a", 1, 2.5, true], nested: [["x"], [null]], empty: [] };

  it("unions mixed element types or falls back to the dynamic type", () => {
    expect(convertValueToSchema(mixed, "typescript")).toContain("  mixed: (string | number | boolean)[];");
    expect(convertValueToSchema(mixed, "typescript")).toContain("  nested: (string | null)[][];");
    expect(convertValueToSchema(mixed, "typescript")).toContain("  empty: unknown[];");
    expect(convertValueToSchema(mixed, "zod")).toContain(
      "  mixed: z.array(z.union([z.string(), z.number(), z.boolean()])),"
    );
    expect(convertValueToSchema(mixed, "go")).toMatch(/\tMixed +\[\]any +`json:"mixed"`/);
    expect(convertValueToSchema(mixed, "go")).toMatch(/\tNested +\[\]\[\]\*string +`json:"nested"`/);
    expect(convertValueToSchema(mixed, "python")).toContain("    mixed: List[Union[str, float, bool]]");
    expect(convertValueToSchema(mixed, "rust")).toContain("    pub mixed: Vec<serde_json::Value>,");
    expect(convertValueToSchema(mixed, "rust")).toContain("    pub nested: Vec<Vec<Option<String>>>,");
  });

  it("merges int and float into a single number type", () => {
    const value = { values: [1, 2.5] };
    expect(convertValueToSchema(value, "zod")).toContain("  values: z.array(z.number()),");
    expect(convertValueToSchema(value, "go")).toContain("[]float64");
    expect(convertValueToSchema(value, "python")).toContain("    values: List[float]");
    expect(convertValueToSchema(value, "rust")).toContain("    pub values: Vec<f64>,");
  });

  it("treats a field that is null in one sample and missing in another as nullable + optional", () => {
    const value = [{ n: "x", s: { a: 1 } }, { n: null, s: null }, {}];
    expect(convertValueToSchema(value, "typescript", "Item")).toBe(
      "export type ItemList = Item[];\n\nexport interface Item {\n  n?: string | null;\n  s?: S | null;\n}\n\nexport interface S {\n  a: number;\n}"
    );
    expect(convertValueToSchema(value, "zod", "Item")).toContain("  n: z.string().nullable().optional(),");
    expect(convertValueToSchema(value, "zod", "Item")).toContain("  s: SSchema.nullable().optional(),");
    const go = convertValueToSchema(value, "go", "Item");
    expect(go).toContain("\tN *string `json:\"n,omitempty\"`");
    expect(go).toContain("\tS *S      `json:\"s,omitempty\"`");
    expect(convertValueToSchema(value, "python", "Item")).toContain("    n: Optional[str] = None\n    s: Optional[S] = None");
    expect(convertValueToSchema(value, "rust", "Item")).toContain("    pub n: Option<String>,\n    pub s: Option<S>,");
  });

  it("keeps a nullable but always-present field required in Python", () => {
    const value = [{ n: "x" }, { n: null }];
    expect(convertValueToSchema(value, "python")).toContain("    n: Optional[str]\n");
    expect(convertValueToSchema(value, "typescript")).toContain("  n: string | null;");
  });
});

describe("convertValueToSchema: root arrays", () => {
  const users = [{ id: 1 }, { id: 2, name: "x" }];

  it("names the element after the root and adds a List alias in every language", () => {
    expect(convertValueToSchema(users, "typescript", "User")).toBe(
      "export type UserList = User[];\n\nexport interface User {\n  id: number;\n  name?: string;\n}"
    );
    expect(convertValueToSchema(users, "zod", "User")).toBe(
      [
        'import { z } from "zod";',
        "",
        "export const UserSchema = z.object({",
        "  id: z.number().int(),",
        "  name: z.string().optional(),",
        "});",
        "export type User = z.infer<typeof UserSchema>;",
        "",
        "export const UserListSchema = z.array(UserSchema);",
        "export type UserList = z.infer<typeof UserListSchema>;",
      ].join("\n")
    );
    expect(convertValueToSchema(users, "go", "User").startsWith("type UserList []User\n\ntype User struct {\n")).toBe(true);
    expect(convertValueToSchema(users, "python", "User").endsWith("\n\nUserList = List[User]")).toBe(true);
    expect(convertValueToSchema(users, "rust", "User")).toContain("pub type UserList = Vec<User>;");
  });

  it("emits only the alias for a root array of primitives", () => {
    expect(convertValueToSchema(["a", "b"], "typescript")).toBe("export type RootList = string[];");
    expect(convertValueToSchema(["a", "b"], "go")).toBe("type RootList []string");
    expect(convertValueToSchema(["a", "b"], "python")).toBe("from typing import List\n\nRootList = List[str]");
    expect(convertValueToSchema(["a", "b"], "rust")).toBe("pub type RootList = Vec<String>;");
    expect(convertValueToSchema(["a", "b"], "zod")).toBe(
      'import { z } from "zod";\n\nexport const RootListSchema = z.array(z.string());\nexport type RootList = z.infer<typeof RootListSchema>;'
    );
  });
});

describe("convertValueToSchema: naming", () => {
  const value = {
    user: { address: { city: "x" } },
    company: { address: { street: "y", zip: 1 } },
    billing: { city: "a" },
    shipping: { city: "b" },
  };

  it("disambiguates different shapes that share a key name", () => {
    const ts = convertValueToSchema(value, "typescript");
    expect(ts).toContain("export interface User {\n  address: Address;\n}");
    expect(ts).toContain("export interface Company {\n  address: CompanyAddress;\n}");
    expect(ts).toContain("export interface CompanyAddress {\n  street: string;\n  zip: number;\n}");
  });

  it("reuses one declaration for structurally identical shapes", () => {
    const ts = convertValueToSchema(value, "typescript");
    expect(ts).toContain("  billing: Address;\n  shipping: Address;");
    expect(ts.match(/export interface Address /g)).toHaveLength(1);
    const zod = convertValueToSchema(value, "zod");
    expect(zod.match(/export const AddressSchema /g)).toHaveLength(1);
  });

  it("singularizes array element names", () => {
    const ts = convertValueToSchema(
      { tags: [{ a: 1 }], addresses: [{ b: 1 }], companies: [{ c: 1 }], items: [{ d: 1 }], statuses: [{ e: 1 }] },
      "typescript"
    );
    expect(ts).toContain("  tags: Tag[];\n  addresses: Address[];\n  companies: Company[];\n  items: Item[];\n  statuses: Status[];");
  });

  it("produces valid type names and avoids names that shadow generated imports", () => {
    const ts = convertValueToSchema({ "123": { a: 1 }, list: { b: 1 }, "名前": { c: 1 } }, "typescript");
    expect(ts).toContain('  "123": T123;');
    expect(ts).toContain("  list: RootList;");
    expect(ts).toContain('  "名前": Item;');
  });
});

describe("Go emitter", () => {
  it("uses initialisms, valid unique field names, aligned columns and omitempty", () => {
    const value = [
      { id: 1, userId: 2, apiURL: "u", html_body: "b", ids: [1], "first-name!": "f", firstName: "g" },
      { id: 2, userId: 3, apiURL: "v", html_body: "c", "first-name!": "f", firstName: "g" },
    ];
    expect(convertValueToSchema(value, "go")).toBe(
      [
        "type RootList []Root",
        "",
        "type Root struct {",
        "\tID         int64   `json:\"id\"`",
        "\tUserID     int64   `json:\"userId\"`",
        "\tAPIURL     string  `json:\"apiURL\"`",
        "\tHTMLBody   string  `json:\"html_body\"`",
        "\tIDs        []int64 `json:\"ids,omitempty\"`",
        "\tFirstName  string  `json:\"first-name!\"`",
        "\tFirstName2 string  `json:\"firstName\"`",
        "}",
      ].join("\n")
    );
  });

  it("prefixes field names that would start with a digit", () => {
    expect(convertValueToSchema({ "123": 1, "": 2 }, "go")).toBe(
      'type Root struct {\n\tField123 int64 `json:"123"`\n\tField    int64 `json:""`\n}'
    );
  });
});

describe("Python emitter", () => {
  it("renames keywords and non-snake keys with aliases and imports Field only when used", () => {
    const py = convertValueToSchema({ class: "a", firstName: "b", from: 1, _id: "x" }, "python");
    expect(py).toBe(
      [
        "from pydantic import BaseModel, Field",
        "",
        "class Root(BaseModel):",
        '    class_: str = Field(alias="class")',
        '    first_name: str = Field(alias="firstName")',
        '    from_: int = Field(alias="from")',
        '    id: str = Field(alias="_id")',
      ].join("\n")
    );
    expect(convertValueToSchema({ a: 1 }, "python")).toBe("from pydantic import BaseModel\n\nclass Root(BaseModel):\n    a: int");
  });

  it("uses Field(default=None, alias=...) for optional aliased fields", () => {
    expect(convertValueToSchema([{ firstName: "a" }, {}], "python")).toContain(
      '    first_name: Optional[str] = Field(default=None, alias="firstName")'
    );
  });
});

describe("Rust emitter", () => {
  it("renames keywords and camelCase keys", () => {
    expect(convertValueToSchema({ type: "a", userName: "b", ok: true }, "rust")).toBe(
      [
        "use serde::{Deserialize, Serialize};",
        "",
        "#[derive(Debug, Clone, Serialize, Deserialize)]",
        "pub struct Root {",
        '    #[serde(rename = "type")]',
        "    pub type_: String,",
        '    #[serde(rename = "userName")]',
        "    pub user_name: String,",
        "    pub ok: bool,",
        "}",
      ].join("\n")
    );
  });
});

describe("Zod emitter", () => {
  it("uses the Zod v4 two-argument record syntax and quotes non-identifier keys", () => {
    const zod = convertValueToSchema({ meta: {}, "first-name": "x" }, "zod");
    expect(zod).toContain("  meta: z.record(z.string(), z.unknown()),");
    expect(zod).toContain('  "first-name": z.string(),');
    expect(zod).not.toContain("z.record(z.unknown())");
  });
});

describe("convertJsonToSchema / jsonToTs", () => {
  it("returns an empty string for blank input and throws on invalid JSON", () => {
    expect(convertJsonToSchema("   ", "go")).toBe("");
    expect(() => convertJsonToSchema("{", "go")).toThrow();
    expect(jsonToTs("")).toBe("");
  });

  it("jsonToTs delegates to the shared TypeScript emitter", () => {
    expect(jsonToTs('{"a":1}', "Thing")).toBe("export interface Thing {\n  a: number;\n}");
    expect(convertJsonToSchema('{"a":1}')).toBe("export interface Root {\n  a: number;\n}");
  });
});

describe("validateJsonForTs", () => {
  it("returns the parsed value on success and accepts blank input", () => {
    expect(validateJsonForTs("")).toEqual({ valid: true });
    expect(validateJsonForTs('{"a":[1]}')).toEqual({ valid: true, value: { a: [1] } });
  });

  it("reports 1-based line and column for errors without a position in the message", () => {
    const result = validateJsonForTs('{\n  "a": 1,\n  "b": x\n}');
    expect(result.valid).toBe(false);
    expect(result.line).toBe(3);
    expect(result.column).toBe(8);
    expect(result.error).not.toMatch(/is not valid JSON|SyntaxError/);
  });

  it("reports line and column for errors with a position and strips it from the message", () => {
    const trailingComma = validateJsonForTs('{\n  "a": 1,\n}');
    expect(trailingComma).toMatchObject({ valid: false, line: 3, column: 1 });
    expect(trailingComma.error).not.toMatch(/position|line \d/);

    const singleLine = validateJsonForTs('{"a":1,}');
    expect(singleLine).toMatchObject({ valid: false, line: 1, column: 8 });
  });

  it("points at the end of the content for truncated input", () => {
    expect(validateJsonForTs('{\n  "a": [1, 2\n\n')).toMatchObject({ valid: false, line: 2, column: 13 });
  });

  it("rejects primitive roots", () => {
    expect(validateJsonForTs("42")).toEqual({ valid: false, error: "JSON root must be an object or an array" });
    expect(validateJsonForTs('"text"').valid).toBe(false);
    expect(validateJsonForTs("null").valid).toBe(false);
  });
});

describe("performance", () => {
  it("converts a ~1MB array of 5,000 objects quickly in every language", () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      uuid: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      name: `User number ${i}`,
      email: `user${i}@example.com`,
      active: i % 2 === 0,
      score: i / 7,
      tags: ["alpha", "beta", "gamma"],
      address: { street: `${i} Main Street`, city: "Springfield", zip: "12345", geo: { lat: 1.25, lng: -2.5 } },
      ...(i % 3 === 0 ? { nickname: null } : {}),
    }));
    const json = JSON.stringify(rows);
    expect(json.length).toBeGreaterThan(1_000_000);

    const start = performance.now();
    const value: unknown = JSON.parse(json);
    const outputs = ALL_LANGUAGES.map((lang) => convertValueToSchema(value, lang, "User"));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1500);
    expect(outputs[0]).toContain("  nickname?: null;");
    expect(outputs[0]).toContain("export type UserList = User[];");
  });
});
