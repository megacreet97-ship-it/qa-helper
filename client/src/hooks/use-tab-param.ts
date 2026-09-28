import { useSearchParams } from "wouter";

/**
 * Keeps the active tab in the URL (?tab=...) so a specific tab can be linked and shared.
 * Usage: const [tab, setTab] = useTabParam("snils", ["snils", "fio"]);
 *        <Tabs value={tab} onValueChange={setTab}>
 */
export function useTabParam(defaultTab: string, allowed?: readonly string[]): [string, (tab: string) => void] {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("tab");
  const tab = fromUrl && (!allowed || allowed.includes(fromUrl)) ? fromUrl : defaultTab;

  const setTab = (next: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === defaultTab) p.delete("tab");
        else p.set("tab", next);
        return p;
      },
      { replace: true },
    );
  };

  return [tab, setTab];
}
