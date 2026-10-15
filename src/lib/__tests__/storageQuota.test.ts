import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY_V1_LEGACY, STORAGE_KEY_V2, loadFromStorageEnvelope, saveToStorageEnvelope } from "../storage";

/** In-memory localStorage that is full: every write throws QuotaExceededError. */
function fullStorage(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: () => {
      throw new DOMException("full", "QuotaExceededError");
    },
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

const globals = globalThis as unknown as { window?: unknown; localStorage?: unknown };

describe("saving when browser storage is full", () => {
  let storage: ReturnType<typeof fullStorage>;

  beforeEach(() => {
    storage = fullStorage({ [STORAGE_KEY_V1_LEGACY]: "{}", devscratchpad_workspace_tabs: "[]" });
    globals.localStorage = storage;
    globals.window = { localStorage: storage };
  });

  afterEach(() => {
    delete globals.localStorage;
    delete globals.window;
  });

  it("does not let another tool's save evict AI Skill Studio data", () => {
    const result = saveToStorageEnvelope("devscratchpad_graph_v1", { source: "x" });
    expect(result.success).toBe(false);
    expect(storage.data.has(STORAGE_KEY_V1_LEGACY)).toBe(true);
    expect(storage.data.has("devscratchpad_workspace_tabs")).toBe(true);
  });

  it("still frees the studio's own caches for the studio's own save", () => {
    saveToStorageEnvelope(STORAGE_KEY_V2, { draft: "x" });
    expect(storage.data.has(STORAGE_KEY_V1_LEGACY)).toBe(false);
  });
});

describe("when site data is blocked", () => {
  beforeEach(() => {
    // Chrome with site data blocked throws on the property access itself.
    globals.window = Object.defineProperty({}, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });

  afterEach(() => {
    delete globals.window;
  });

  it("reports a failed save and an empty load instead of throwing", () => {
    expect(() => saveToStorageEnvelope("devscratchpad_graph_v1", { source: "x" })).not.toThrow();
    expect(saveToStorageEnvelope("devscratchpad_graph_v1", { source: "x" }).success).toBe(false);
    expect(loadFromStorageEnvelope("devscratchpad_graph_v1", "unused")).toBeNull();
  });
});
