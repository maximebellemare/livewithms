import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAdminArticles, useUpsertArticle, useDeleteArticle } from "@/hooks/useAdmin";

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

export default ArticlesTab;
