import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ReportDataset } from "@/server/services/report.service";

export function DatasetView({ dataset }: { dataset: ReportDataset }) {
  return (
    <div className="space-y-4">
      {dataset.summary && Object.keys(dataset.summary).length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(dataset.summary).map(([k, v]) => (
            <Card key={k} className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dataset.sections.length === 0 ? (
        <EmptyState title="No data for these filters" description="Try widening the date range or clearing filters." />
      ) : (
        dataset.sections.map((section) => (
          <Card key={section.heading}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{section.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              {section.rows.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No records.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        {section.columns.map((c) => (
                          <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-medium">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {section.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="whitespace-nowrap px-3 py-2 tabular-nums">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
