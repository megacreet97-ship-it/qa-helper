import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "qa-helper:";

/**
 * Drop-in replacement for useState that remembers the value in localStorage.
 * Use for settings (counts, formats, toggles) — not for generated results or large text.
 */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = PREFIX + key;

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      // ignore stored values of a different type (e.g. after a code change)
      return typeof parsed === typeof initial ? (parsed as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // storage full or disabled — settings just won't persist
    }
  }, [storageKey, value]);

  return [value, setValue];
}
