import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Shield, ShieldCheck, ShieldOff, FileText, Users, Flag, Plus, Pencil, Trash2, EyeOff, Eye, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, MessageSquare, CalendarIcon, X } from "lucide-react";
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useIsAdmin,
  useAdminArticles,
  useUpsertArticle,
  useDeleteArticle,
  useAdminUsers,
  useAdminReports,
  useToggleRole,
  useCoachFeedbackStats,
} from "@/hooks/useAdmin";
import { useResolveReport, useHidePost, useHideComment } from "@/hooks/useCommunity";

/* ─── Article Form ─────────────────────────────────────── */
const emptyArticle = {
  title: "",
  summary: "",
  body: "",
  category: "Basics",
  read_time: "3 min",
  published: true,
  sort_order: 0,
};

const ArticleForm = ({
  initial,
  onClose,
}: {
  initial?: any;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(initial ?? emptyArticle);
  const upsert = useUpsertArticle();

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error("Title and summary are required");
      return;
    }
    await upsert.mutateAsync(form);
    toast.success(initial?.id ? "Article updated" : "Article created");
    onClose();
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Input
        placeholder="Category (e.g. Basics, Treatment, Lifestyle)"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <div className="flex gap-2">
        <Input
          placeholder="Read time"
          value={form.read_time}
          onChange={(e) => setForm({ ...form, read_time: e.target.value })}
          className="w-28"
        />
        <Input
          placeholder="Sort order"
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          className="w-28"
        />
      </div>
      <Textarea
        placeholder="Summary"
        value={form.summary}
        onChange={(e) => setForm({ ...form, summary: e.target.value })}
        rows={2}
      />
      <Textarea
        placeholder="Article body (Markdown supported)"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={10}
      />
      <div className="flex items-center gap-2">
        <Switch
          checked={form.published}
          onCheckedChange={(v) => setForm({ ...form, published: v })}
        />
        <span className="text-sm text-muted-foreground">Published</span>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {initial?.id ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};

/* ─── Articles Tab ─────────────────────────────────────── */
const ArticlesTab = () => {
  const { data: articles = [], isLoading } = useAdminArticles();
  const deleteArticle = useDeleteArticle();
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-muted-foreground">{articles.length} articles</span>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Article
        </Button>
      </div>

      <div className="space-y-2">
        {articles.map((a: any) => (
          <Card key={a.id} className={`${!a.published ? "opacity-60" : ""}`}>
            <CardContent className="p-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{a.title}</span>
                  {!a.published && <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
                </div>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>{a.category}</span>
                  <span>·</span>
                  <span>{a.read_time}</span>
                  <span>·</span>
                  <span>Order: {a.sort_order}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(a); setShowForm(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={async () => {
                    await deleteArticle.mutateAsync(a.id);
                    toast.success("Article deleted");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <ArticleForm
            initial={editing}
            onClose={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ─── Users Tab ────────────────────────────────────────── */
const UsersTab = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleRole = useToggleRole();
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u: any) =>
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.includes(search)
  );

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>;

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Input
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} users</span>
      </div>
      <div className="space-y-2">
        {filtered.map((u: any) => {
          const isMod = u.roles.includes("moderator");
          const isAdmin = u.roles.includes("admin");
          return (
            <Card key={u.user_id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(u.display_name ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.display_name || "Anonymous"}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>{u.ms_type || "—"}</span>
                    <span>·</span>
                    <span>Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.roles.map((r: string) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px]">
                      {r}
                    </Badge>
                  ))}
                  {!isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={isMod ? "Remove moderator" : "Make moderator"}
                      disabled={toggleRole.isPending}
                      onClick={async () => {
                        await toggleRole.mutateAsync({
                          userId: u.user_id,
                          role: "moderator",
                          action: isMod ? "remove" : "add",
                        });
                        toast.success(isMod ? "Moderator role removed" : "Moderator role assigned");
                      }}
                    >
                      {isMod ? <ShieldOff className="h-3.5 w-3.5 text-destructive" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

/* ─── Moderation Tab ───────────────────────────────────── */
const ModerationTab = () => {
  const { data: reports = [], isLoading } = useAdminReports();
  const resolveReport = useResolveReport();
  const hidePost = useHidePost();
  const hideComment = useHideComment();
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const pending = reports.filter((r: any) => r.status === "pending");
  const display = tab === "pending" ? pending : reports;

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;

  return (
    <>
      <div className="flex gap-2 mb-3">
        <Button
          variant={tab === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("pending")}
        >
          Pending ({pending.length})
        </Button>
        <Button
          variant={tab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("all")}
        >
          All ({reports.length})
        </Button>
      </div>

      {display.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {tab} reports</p>
        </div>
      ) : (
        <div className="space-y-2">
          {display.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {r.post_id ? `Post ${r.post_id.slice(0, 8)}…` : `Comment ${r.comment_id?.slice(0, 8)}…`}
                      {" · "}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant={r.status === "pending" ? "destructive" : r.status === "resolved" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {r.status}
                  </Badge>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (r.post_id) await hidePost.mutateAsync({ postId: r.post_id, hidden: true });
                        if (r.comment_id) await hideComment.mutateAsync({ commentId: r.comment_id, hidden: true });
                        await resolveReport.mutateAsync({ reportId: r.id, status: "resolved" });
                        toast.success("Content hidden & report resolved");
                      }}
                    >
                      <EyeOff className="h-3 w-3 mr-1" /> Hide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await resolveReport.mutateAsync({ reportId: r.id, status: "dismissed" });
                        toast.success("Report dismissed");
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

/* ─── Feedback Tab ─────────────────────────────────────── */
const presets = [
  { label: "All time", value: "all" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "Custom", value: "custom" },
] as const;

const FeedbackTab = () => {
  const { data: stats = [], isLoading } = useCoachFeedbackStats();
  const [preset, setPreset] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const handlePreset = (v: string) => {
    setPreset(v);
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

      {/* Per-session breakdown */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
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
      )}
    </>
  );
};

/* ─── Main Page ────────────────────────────────────────── */
const AdminPage = () => {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-2xl">🧡</span>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/today" replace />;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Manage your platform" />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <Tabs defaultValue="articles">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="articles" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Articles
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1.5 text-xs">
              <Flag className="h-3.5 w-3.5" /> Reports
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5 text-xs">
              <ThumbsUp className="h-3.5 w-3.5" /> Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            <ArticlesTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="moderation">
            <ModerationTab />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminPage;
