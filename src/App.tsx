import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import ThemeWrapper from "@/components/ThemeWrapper";
import AppShell from "./components/AppShell";
import AnimatedPage from "./components/AnimatedPage";
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
import RelapsesPage from "./pages/RelapsesPage";
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

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={user ? <Navigate to="/today" replace /> : <AnimatedPage><Index /></AnimatedPage>} />
        <Route path="/auth" element={user ? <Navigate to="/today" replace /> : <AnimatedPage><AuthPage /></AnimatedPage>} />
        <Route path="/reset-password" element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />
        <Route path="/onboarding" element={<ProtectedRoute><AnimatedPage><OnboardingPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/today" element={<ProtectedRoute><AnimatedPage><TodayPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><AnimatedPage><TrackPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><AnimatedPage><InsightsPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><AnimatedPage><LearnPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><AnimatedPage><CommunityPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><AnimatedPage><JournalPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><AnimatedPage><MedicationsPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><AnimatedPage><AppointmentsPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AnimatedPage><ReportsPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><AnimatedPage><PrivacyPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/notifications/settings" element={<ProtectedRoute><AnimatedPage><NotificationSettingsPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/my-ms-history" element={<ProtectedRoute><AnimatedPage><MyMSHistoryPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/relapses" element={<ProtectedRoute><AnimatedPage><RelapsesPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/community/guidelines" element={<ProtectedRoute><AnimatedPage><CommunityGuidelinesPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><AnimatedPage><FeaturesRoadmapPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/coming-soon/:feature" element={<ProtectedRoute><AnimatedPage><ComingSoonPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AnimatedPage><AdminPage /></AnimatedPage></ProtectedRoute>} />
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><span className="text-2xl">🧡</span></div>;
  }

  return (
    <AppShell>
      <AnimatedRoutes />
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
