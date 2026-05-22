import { useState } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { Download } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { buildHtmlDocument, downloadBlob, htmlBlob, escapeHtml } from "@/lib/browser-export";

export default function ExportRelapseHistory() {
  const { data: relapses = [] } = useRelapses();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (relapses.length === 0) {
      toast.error("No relapses to export");
      return;
    }

    setExporting(true);
    try {
      const recovered = relapses.filter((r) => r.is_recovered).length;
      const ongoing = relapses.filter((r) => !r.is_recovered).length;
      const rows = relapses.map((r) => {
        const start = parseISO(r.start_date);
        const end = r.end_date ? parseISO(r.end_date) : new Date();
        const dur = differenceInDays(end, start) + 1;
        return `<tr>
          <td>${escapeHtml(format(start, "MMM d, yyyy"))}</td>
          <td>${escapeHtml(r.end_date ? format(parseISO(r.end_date), "MMM d, yyyy") : "Ongoing")}</td>
          <td>${escapeHtml(`${dur} days`)}</td>
          <td>${escapeHtml(r.severity.charAt(0).toUpperCase() + r.severity.slice(1))}</td>
          <td>${escapeHtml(r.symptoms.join(", ") || "—")}</td>
          <td>${escapeHtml(r.treatment || "—")}</td>
          <td>${escapeHtml(r.is_recovered ? "Yes" : "No")}</td>
        </tr>`;
      }).join("");
      const notes = relapses
        .filter((relapse) => relapse.notes?.trim())
        .map(
          (relapse) => `<li><strong>${escapeHtml(format(parseISO(relapse.start_date), "MMM d, yyyy"))}:</strong> ${escapeHtml(relapse.notes!.trim())}</li>`,
        )
        .join("");

      const html = buildHtmlDocument("Relapse history report", [
        {
          heading: "Overview",
          body: `<p>${escapeHtml(
            `Generated ${format(new Date(), "MMM d, yyyy")} · ${relapses.length} relapse${relapses.length !== 1 ? "s" : ""}`,
          )}</p><p>${escapeHtml(
            `Recovery rate: ${Math.round((recovered / relapses.length) * 100)}% · Recovered: ${recovered} · Ongoing: ${ongoing}`,
          )}</p>`,
        },
        {
          heading: "Relapse log",
          body: `<table><thead><tr><th>Start</th><th>End</th><th>Duration</th><th>Severity</th><th>Symptoms</th><th>Treatment</th><th>Recovered</th></tr></thead><tbody>${rows}</tbody></table>`,
        },
        ...(notes
          ? [
              {
                heading: "Notes",
                body: `<ul>${notes}</ul>`,
              },
            ]
          : []),
      ]);

      downloadBlob(htmlBlob(html), `relapse-history-${format(new Date(), "yyyy-MM-dd")}.html`);
      toast.success("Export downloaded");
    } catch {
      toast.error("Failed to export relapse history");
    } finally {
      setExporting(false);
    }
  };

  if (relapses.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <Download className="h-3 w-3" />
      )}
      Export
    </button>
  );
}
