/**
 * The semantic checker's tokenizer (spec §9): BERT's uncased WordPiece over the encoder's vocab.txt, plus the
 * special tokens of semanticInput.ts, written here so the connector needs no tokenizer package. It must give
 * exactly the ids the Hugging Face tokenizer gave in training; __tests__/fixtures/semanticTokenizer.json holds
 * pairs tokenized there (ml/sg-sem/sgsem/fixture.py), and the test checks every one token for token.
 *
 * Steps, as in BertTokenizerFast with do_lower_case: split out the special tokens; clean (drop control
 * characters, every whitespace to a space); space out CJK characters; lower-case and strip accents; split on
 * whitespace and punctuation; greedy longest-match WordPiece per word, `##` for a continuation, [UNK] for a
 * word no pieces cover or longer than 100 characters.
 */
import { SEM_SPECIAL_TOKENS } from "./semanticInput";

const PAD = "[PAD]";
const UNK = "[UNK]";
const CLS = "[CLS]";
const SEP = "[SEP]";
const MAX_WORD_CHARS = 100;
const CONTINUATION = "##";

export interface Encoded {
  ids: number[];
  /** 0 for [CLS], text A and its [SEP]; 1 for text B and the final [SEP]. */
  types: number[];
}

export class WordPieceTokenizer {
  private readonly ids = new Map<string, number>();
  private readonly specialSet: Set<string>;
  private readonly specials: RegExp;
  readonly padId: number;
  readonly unkId: number;
  readonly clsId: number;
  readonly sepId: number;

  /** `vocab` is vocab.txt: one token per line, the line number its id. The special tokens follow it, in order. */
  constructor(vocab: string, specialTokens: readonly string[] = SEM_SPECIAL_TOKENS) {
    const lines = vocab.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    lines.forEach((token, id) => this.ids.set(token.replace(/\r$/, ""), id));
    for (const token of specialTokens) if (!this.ids.has(token)) this.ids.set(token, this.ids.size);
    const all = [PAD, UNK, CLS, SEP, "[MASK]", ...specialTokens];
    this.specialSet = new Set(all);
    this.specials = new RegExp(`(${all.map((token) => token.replace(/[[\]]/g, "\\$&")).join("|")})`);
    this.padId = this.id(PAD);
    this.unkId = this.id(UNK);
    this.clsId = this.id(CLS);
    this.sepId = this.id(SEP);
  }

  get size(): number {
    return this.ids.size;
  }

  private id(token: string): number {
    const id = this.ids.get(token);
    if (id === undefined) throw new Error(`vocab.txt lacks ${token}`);
    return id;
  }

  /** The ids of one text, without [CLS] or [SEP]. */
  tokenize(text: string): number[] {
    const out: number[] = [];
    // Special tokens are matched before any normalisation, so `[H4]` matches and `[h4]` does not.
    for (const part of text.split(this.specials)) {
      if (part === "") continue;
      if (this.specialSet.has(part)) {
        out.push(this.id(part));
        continue;
      }
      for (const word of basicTokens(part)) out.push(...this.wordPiece(word));
    }
    return out;
  }

  private wordPiece(word: string): number[] {
    if ([...word].length > MAX_WORD_CHARS) return [this.unkId];
    const pieces: number[] = [];
    let start = 0;
    while (start < word.length) {
      let end = word.length;
      let found: number | undefined;
      while (start < end) {
        const piece = (start > 0 ? CONTINUATION : "") + word.slice(start, end);
        found = this.ids.get(piece);
        if (found !== undefined) break;
        end -= 1;
      }
      if (found === undefined) return [this.unkId];
      pieces.push(found);
      start = end;
    }
    return pieces;
  }

  /**
   * A pair as the model reads it: `[CLS] A [SEP] B [SEP]`, cut to `maxLen` tokens the way training did
   * (`longest_first`: one token at a time from whichever text is longer, B when they tie).
   */
  encode(textA: string, textB: string, maxLen: number): Encoded {
    const a = this.tokenize(textA);
    const b = this.tokenize(textB);
    const specials = textB === "" ? 2 : 3;
    while (a.length + b.length + specials > maxLen) {
      if (a.length > b.length) a.pop();
      else b.pop();
    }
    if (textB === "") return { ids: [this.clsId, ...a, this.sepId], types: new Array<number>(a.length + 2).fill(0) };
    return {
      ids: [this.clsId, ...a, this.sepId, ...b, this.sepId],
      types: [...new Array<number>(a.length + 2).fill(0), ...new Array<number>(b.length + 1).fill(1)],
    };
  }
}

/* ------------------------------------------------------------------ BERT's basic tokenizer */

const CJK = /[㐀-䶿一-鿿豈-﫿\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}\u{2F800}-\u{2FA1F}]/u;
const WHITESPACE = /[ \t\n\r\p{Zs}]/u;
// Everything in a C* category except tab, newline and return, which count as whitespace.
const CONTROL = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Cn}]/u;
const PUNCTUATION = /[!-/:-@[-`{-~\p{P}]/u;

function isWhitespace(ch: string): boolean {
  return WHITESPACE.test(ch);
}

function isControl(ch: string): boolean {
  if (ch === "\t" || ch === "\n" || ch === "\r") return false;
  return CONTROL.test(ch);
}

/** Lower-cased words and single punctuation marks, in order; the input text is one segment between special tokens. */
function basicTokens(text: string): string[] {
  let cleaned = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 0 || code === 0xfffd || isControl(ch)) continue;
    cleaned += isWhitespace(ch) ? " " : ch;
  }
  let spaced = "";
  for (const ch of cleaned) spaced += CJK.test(ch) ? ` ${ch} ` : ch;

  const words: string[] = [];
  for (const raw of spaced.split(" ")) {
    if (raw === "") continue;
    const lowered = stripAccents(raw.toLowerCase());
    let current = "";
    for (const ch of lowered) {
      if (PUNCTUATION.test(ch)) {
        if (current) words.push(current);
        words.push(ch);
        current = "";
      } else {
        current += ch;
      }
    }
    if (current) words.push(current);
  }
  return words;
}

function stripAccents(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFD")) if (!/\p{Mn}/u.test(ch)) out += ch;
  return out;
}
