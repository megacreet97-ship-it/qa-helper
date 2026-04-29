import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground" data-testid="text-result-title">
          {title || `Результаты (${results.length})`}
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
      <Card className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 px-3 py-2 border-b last:border-b-0 group"
              data-testid={`text-result-item-${index}`}
            >
              <code className="text-sm font-mono break-all flex-1">{result}</code>
              <div className="invisible group-hover:visible flex-shrink-0">
                <CopyButton text={result} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
