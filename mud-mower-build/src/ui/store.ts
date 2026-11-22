// localStorage wrapped in try/catch with an in-memory fallback (private windows, blocked storage).
const mem = new Map<string, string>();
export const store = {
  get(k: string): string | null {
    try { const v = localStorage.getItem(k); if (v !== null) return v; } catch { /* fall through */ }
    return mem.get(k) ?? null;
  },
  set(k: string, v: string) {
    mem.set(k, v);
    try { localStorage.setItem(k, v); } catch { /* memory only */ }
  },
  getJSON<T>(k: string, d: T): T { try { const v = this.get(k); return v ? JSON.parse(v) as T : d; } catch { return d; } },
  setJSON(k: string, v: unknown) { this.set(k, JSON.stringify(v)); },
};
