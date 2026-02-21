import { Navigate } from "react-router-dom";
import { FileText, Users, Flag, ThumbsUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin } from "@/hooks/useAdmin";
import ArticlesTab from "@/components/admin/ArticlesTab";
import UsersTab from "@/components/admin/UsersTab";
import ModerationTab from "@/components/admin/ModerationTab";
import FeedbackTab from "@/components/admin/FeedbackTab";

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
