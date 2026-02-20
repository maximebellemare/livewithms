import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import ThemeWrapper from "@/components/ThemeWrapper";
import AppShell from "./components/AppShell";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import TodayPage from "./pages/TodayPage";
import TrackPage from "./pages/TrackPage";
import InsightsPage from "./pages/InsightsPage";
import LearnPage from "./pages/LearnPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import JournalPage from "./pages/JournalPage";
import MedicationsPage from "./pages/MedicationsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import ReportsPage from "./pages/ReportsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/PrivacyPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import FeaturesRoadmapPage from "./pages/FeaturesRoadmapPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import MyMSHistoryPage from "./pages/MyMSHistoryPage";
import CommunityGuidelinesPage from "./pages/CommunityGuidelinesPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || profileLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><span className="text-2xl">🧡</span></div>;
  if (!user) return <Navigate to="/auth" replace />;

  // Redirect to onboarding if not completed (but don't redirect if already on /onboarding)
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><span className="text-2xl">🧡</span></div>;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/today" replace /> : <Index />} />
        <Route path="/auth" element={user ? <Navigate to="/today" replace /> : <AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
        <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
        <Route path="/my-ms-history" element={<ProtectedRoute><MyMSHistoryPage /></ProtectedRoute>} />
        <Route path="/community/guidelines" element={<ProtectedRoute><CommunityGuidelinesPage /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><FeaturesRoadmapPage /></ProtectedRoute>} />
        <Route path="/coming-soon/:feature" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <ThemeWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeWrapper>
  </ThemeProvider>
);

export default App;
