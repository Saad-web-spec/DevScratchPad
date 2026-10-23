import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SEM_SPECIAL_TOKENS } from "../semanticInput";
import { WordPieceTokenizer } from "../semanticTokenizer";

const vocab = readFileSync(join(process.cwd(), "models", "sg-sem", "vocab.txt"), "utf8");
const fixture = JSON.parse(readFileSync(join(__dirname, "fixtures", "semanticTokenizer.json"), "utf8")) as { a: string; b: string; ids: number[]; types: number[] }[];

describe("semantic tokenizer: the same ids the training tokenizer gave", () => {
  const tokenizer = new WordPieceTokenizer(vocab);

  it("has BERT's vocabulary and the special tokens after it, in order", () => {
    expect(tokenizer.size).toBe(30_522 + SEM_SPECIAL_TOKENS.length);
    expect(tokenizer.clsId).toBe(101);
    expect(tokenizer.sepId).toBe(102);
    expect(tokenizer.unkId).toBe(100);
    expect(tokenizer.tokenize("[H4]")).toEqual([30_525]);
    expect(tokenizer.tokenize("[CANDIDATE]")).toEqual([30_533]);
  });

  it("matches the Hugging Face tokenizer on every fixture pair, token for token", () => {
    expect(fixture.length).toBeGreaterThan(150);
    const wrong: string[] = [];
    for (const pair of fixture) {
      const encoded = tokenizer.encode(pair.a, pair.b, 384);
      if (encoded.ids.join(",") !== pair.ids.join(",") || encoded.types.join(",") !== pair.types.join(",")) wrong.push(`${JSON.stringify(pair.a.slice(0, 80))} / ${JSON.stringify(pair.b.slice(0, 40))}`);
    }
    expect(wrong, `${wrong.length} of ${fixture.length} pairs differ:\n${wrong.slice(0, 10).join("\n")}`).toEqual([]);
  });

  it("matches a special token only as written: not lower-cased, not inside a word's letters", () => {
    expect(tokenizer.tokenize("[h4]")).not.toContain(30_525);
    expect(tokenizer.tokenize("x[SEN]x")).toEqual([...tokenizer.tokenize("x"), 30_532, ...tokenizer.tokenize("x")]);
  });

  it("cuts a pair to the window from the longer text first", () => {
    const long = "word ".repeat(500);
    const encoded = tokenizer.encode(long, "short text", 64);
    expect(encoded.ids).toHaveLength(64);
    expect(encoded.ids[0]).toBe(101);
    expect(encoded.ids[encoded.ids.length - 1]).toBe(102);
    expect(encoded.types.filter((type) => type === 1)).toHaveLength(3);
  });
});
