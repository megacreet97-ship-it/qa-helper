import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ResultDisplayProps {
  results: string[];
  title?: string;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
}

export function ResultDisplay({ results, title, onExportJSON, onExportCSV }: ResultDisplayProps) {
  if (results.length === 0) return null;

  const allText = results.join("\n");

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground" data-testid="text-result-title">
          {title || "Результаты"}
          <span className="ml-1.5 font-mono text-xs text-muted-foreground/70">{results.length}</span>
        </h3>
        <div className="flex items-center gap-1 flex-wrap">
          <CopyButton text={allText} variant="outline" size="sm" />
          {onExportJSON && (
            <Button variant="outline" size="sm" onClick={onExportJSON} data-testid="button-export-json">
              <Download className="w-3 h-3 mr-1" /> JSON
            </Button>
          )}
          {onExportCSV && (
            <Button variant="outline" size="sm" onClick={onExportCSV} data-testid="button-export-csv">
              <Download className="w-3 h-3 mr-1" /> CSV
            </Button>
          )}
        </div>
      </div>
      <ol className="max-h-80 overflow-y-auto rounded-lg border bg-muted/40 py-1">
        {results.map((result, index) => (
          <li
            key={index}
            className="group flex items-center gap-3 px-3 py-1 transition-colors hover:bg-muted"
            data-testid={`text-result-item-${index}`}
          >
            <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground/60 select-none">
              {index + 1}
            </span>
            <code className="flex-1 break-all font-mono text-sm">{result}</code>
            <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
              <CopyButton text={result} className="h-7 w-7" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
