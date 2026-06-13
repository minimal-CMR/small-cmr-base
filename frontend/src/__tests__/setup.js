// Setup globale dei test: mock localStorage, fetch base.
import { vi, beforeEach } from 'vitest';

// happy-dom ha già localStorage, ma resettiamo a ogni test.
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// Mock fetch (per /health/* in useModules) — non vogliamo richieste reali.
globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false }));
