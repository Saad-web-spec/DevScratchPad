export interface HistoryEntry {
 id: string;
 toolId: string;
 toolName: string;
 input: string;
 timestamp: number;
}

const STORAGE_KEY ="devscratchpad_history";
const MAX_ENTRIES = 15;

function getHistory(): HistoryEntry[] {
 if (typeof window ==="undefined") return [];
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
}

function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  let currentEntries = [...entries];
  while (currentEntries.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEntries));
      return; // Success
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        // Evict oldest entry (last element) and try again
        currentEntries.pop();
      } else {
        break; // Stop on unknown errors
      }
    }
  }
}

export function addHistoryEntry(
 toolId: string,
 toolName: string,
 input: string
): void {
 if (!input || input.trim().length === 0) return;

 const entries = getHistory();
 const entry: HistoryEntry = {
 id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
 toolId,
 toolName,
 input: input.slice(0, 5000), // Cap stored input at 5KB
 timestamp: Date.now(),
 };

 // Prepend and trim to MAX_ENTRIES
 const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
 saveHistory(updated);
}

export function getHistoryEntries(): HistoryEntry[] {
 return getHistory();
}

export function clearHistory(): void {
 if (typeof window ==="undefined") return;
 localStorage.removeItem(STORAGE_KEY);
}

export function deleteHistoryEntry(id: string): void {
 const entries = getHistory().filter((e) => e.id !== id);
 saveHistory(entries);
}

export function formatRelativeTime(timestamp: number): string {
 const diff = Date.now() - timestamp;
 const seconds = Math.floor(diff / 1000);
 if (seconds < 60) return"just now";
 const minutes = Math.floor(seconds / 60);
 if (minutes < 60) return `${minutes}m ago`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours}h ago`;
 const days = Math.floor(hours / 24);
 return `${days}d ago`;
}

// --- WORKSPACE SNAPSHOTS ---

export interface WorkspaceSnapshot {
 id: string;
 name: string;
 toolId: string;
 toolName: string;
 input: string;
 output: string;
 timestamp: number;
}

const SNAPSHOTS_KEY ="devscratchpad_snapshots";

export function getSnapshots(): WorkspaceSnapshot[] {
 if (typeof window ==="undefined") return [];
 try {
 const raw = localStorage.getItem(SNAPSHOTS_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
}

export function saveSnapshots(snapshots: WorkspaceSnapshot[]): void {
  if (typeof window === "undefined") return;
  let currentSnapshots = [...snapshots];
  while (currentSnapshots.length > 0) {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(currentSnapshots));
      return;
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        currentSnapshots.pop();
      } else {
        break;
      }
    }
  }
}

export function addSnapshot(
 toolId: string,
 toolName: string,
 input: string,
 output: string
): WorkspaceSnapshot | null {
 if (!input) return null;

 const snapshots = getSnapshots();
 const dateStr = new Date().toLocaleDateString(undefined, {
 month:"short",
 day:"numeric",
 hour:"2-digit",
 minute:"2-digit",
 });
 
 const snapshot: WorkspaceSnapshot = {
 id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
 name: `${toolName} Snapshot (${dateStr})`,
 toolId,
 toolName,
 input,
 output,
 timestamp: Date.now(),
 };

 const updated = [snapshot, ...snapshots]; // No arbitrary hard limit for now
 saveSnapshots(updated);
 return snapshot;
}

export function deleteSnapshot(id: string): void {
 const snapshots = getSnapshots().filter((s) => s.id !== id);
 saveSnapshots(snapshots);
}
