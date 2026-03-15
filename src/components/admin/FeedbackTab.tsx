import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, CalendarIcon, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FeedbackTrendsChart } from "@/components/admin/FeedbackTrendsChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCoachFeedbackStats } from "@/hooks/useAdmin";

const presets = [
  { label: "All time", value: "all" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "Custom", value: "custom" },
] as const;

const ITEMS_PER_PAGE = 10;

const FeedbackTab = () => {
  const { data: stats = [], isLoading } = useCoachFeedbackStats();
  const [preset, setPreset] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  const handlePreset = (v: string) => {
    setPreset(v);
    setPage(1);
    if (v === "all") { setFromDate(undefined); setToDate(undefined); }
    else if (v === "7d") { setFromDate(subDays(new Date(), 7)); setToDate(undefined); }
    else if (v === "30d") { setFromDate(subDays(new Date(), 30)); setToDate(undefined); }
    else if (v === "90d") { setFromDate(subMonths(new Date(), 3)); setToDate(undefined); }
  };

  const filtered = stats.filter((s) => {
    const d = new Date(s.session_created_at);
    if (fromDate && isBefore(d, startOfDay(fromDate))) return false;
    if (toDate && isAfter(d, endOfDay(toDate))) return false;
    return true;
  });

  const totalUp = filtered.reduce((s, r) => s + Number(r.thumbs_up), 0);
  const totalDown = filtered.reduce((s, r) => s + Number(r.thumbs_down), 0);
  const total = totalUp + totalDown;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Session Title", "User", "Mode", "Date", "Thumbs Up", "Thumbs Down"];
    const rows = filtered.map((s) => [
      `"${(s.session_title ?? "").replace(/"/g, '""')}"`,
      `"${(s.user_display_name ?? "").replace(/"/g, '""')}"`,
      s.session_mode,
      format(new Date(s.session_created_at), "yyyy-MM-dd"),
      s.thumbs_up,
      s.thumbs_down,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;

  return (
    <>
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {presets.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={preset === p.value ? "default" : "outline"}
            className="text-xs h-7"
            onClick={() => handlePreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
        {filtered.length > 0 && (
          <Button size="sm" variant="outline" className="text-xs h-7 ml-auto gap-1" onClick={exportCSV}>
            <Download className="h-3 w-3" /> Export CSV
          </Button>
        )}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs h-7 gap-1", !fromDate && "text-muted-foreground")}>
                <CalendarIcon className="h-3 w-3" />
                {fromDate ? format(fromDate, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs h-7 gap-1", !toDate && "text-muted-foreground")}>
                <CalendarIcon className="h-3 w-3" />
                {toDate ? format(toDate, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setFromDate(undefined); setToDate(undefined); }}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground">Total Reactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-primary">{totalUp}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Helpful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <ThumbsDown className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{totalDown}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Not Helpful</p>
          </CardContent>
        </Card>
      </div>

      {total > 0 && (
        <div className="mb-4">
          <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
            <div className="bg-primary h-full transition-all" style={{ width: `${(totalUp / total) * 100}%` }} />
            <div className="bg-destructive h-full transition-all" style={{ width: `${(totalDown / total) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {total > 0 ? Math.round((totalUp / total) * 100) : 0}% positive
          </p>
        </div>
      )}

      {/* Trends chart */}
      {filtered.length > 0 && <FeedbackTrendsChart data={filtered} />}

      {/* Per-session breakdown */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-secondary/50 px-4 py-8 text-center space-y-1.5 animate-fade-in">
          <MessageSquare className="h-7 w-7 text-primary mx-auto" />
          <p className="text-sm font-medium text-foreground mt-2">No feedback yet</p>
          <p className="text-xs text-muted-foreground">Feedback from users will appear here as it comes in.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedItems.map((s) => (
              <Card key={s.session_id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.session_title}</p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{s.user_display_name}</span>
                        <span>·</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{s.session_mode}</Badge>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(s.session_created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      <span className="flex items-center gap-0.5 text-primary">
                        <ThumbsUp className="h-3 w-3" /> {s.thumbs_up}
                      </span>
                      <span className="flex items-center gap-0.5 text-destructive">
                        <ThumbsDown className="h-3 w-3" /> {s.thumbs_down}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-muted-foreground">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} sessions
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default FeedbackTab;
