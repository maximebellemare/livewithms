import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLoadingSkeleton from "@/components/PageSkeleton";
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

// Eagerly loaded (landing + auth — needed immediately)
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";

// Lazy-loaded pages
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const TodayPage = lazy(() => import("./pages/TodayPage"));
const TrackPage = lazy(() => import("./pages/TrackPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const MedicationsPage = lazy(() => import("./pages/MedicationsPage"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const FeaturesRoadmapPage = lazy(() => import("./pages/FeaturesRoadmapPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const MyMSHistoryPage = lazy(() => import("./pages/MyMSHistoryPage"));
const RelapsesPage = lazy(() => import("./pages/RelapsesPage"));
const CommunityGuidelinesPage = lazy(() => import("./pages/CommunityGuidelinesPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const EnergyBudgetPage = lazy(() => import("./pages/EnergyBudgetPage"));
const LifestylePage = lazy(() => import("./pages/LifestylePage"));
const SmartMatchingPage = lazy(() => import("./pages/SmartMatchingPage"));
const CognitivePage = lazy(() => import("./pages/CognitivePage"));
const CoachPage = lazy(() => import("./pages/CoachPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || profileLoading) return <AppLoadingSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;

  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<AppLoadingSkeleton />}>
    <AnimatedPage>{children}</AnimatedPage>
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={user ? <Navigate to="/today" replace /> : <AnimatedPage><Index /></AnimatedPage>} />
        <Route path="/auth" element={user ? <Navigate to="/today" replace /> : <AnimatedPage><AuthPage /></AnimatedPage>} />
        <Route path="/reset-password" element={<LazyPage><ResetPasswordPage /></LazyPage>} />
        <Route path="/onboarding" element={<ProtectedRoute><LazyPage><OnboardingPage /></LazyPage></ProtectedRoute>} />
        <Route path="/today" element={<ProtectedRoute><LazyPage><TodayPage /></LazyPage></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><LazyPage><TrackPage /></LazyPage></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><LazyPage><InsightsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LazyPage><LearnPage /></LazyPage></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><LazyPage><CommunityPage /></LazyPage></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><LazyPage><JournalPage /></LazyPage></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><LazyPage><ProfilePage /></LazyPage></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><LazyPage><MedicationsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><LazyPage><AppointmentsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><LazyPage><ReportsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><LazyPage><PrivacyPage /></LazyPage></ProtectedRoute>} />
        <Route path="/notifications/settings" element={<ProtectedRoute><LazyPage><NotificationSettingsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/my-ms-history" element={<ProtectedRoute><LazyPage><MyMSHistoryPage /></LazyPage></ProtectedRoute>} />
        <Route path="/relapses" element={<ProtectedRoute><LazyPage><RelapsesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/community/guidelines" element={<ProtectedRoute><LazyPage><CommunityGuidelinesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><LazyPage><FeaturesRoadmapPage /></LazyPage></ProtectedRoute>} />
        <Route path="/coming-soon/:feature" element={<ProtectedRoute><LazyPage><ComingSoonPage /></LazyPage></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><LazyPage><AdminPage /></LazyPage></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><LazyPage><TermsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><LazyPage><BadgesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><LazyPage><MessagesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/energy" element={<ProtectedRoute><LazyPage><EnergyBudgetPage /></LazyPage></ProtectedRoute>} />
        <Route path="/lifestyle" element={<ProtectedRoute><LazyPage><LifestylePage /></LazyPage></ProtectedRoute>} />
        <Route path="/matching" element={<ProtectedRoute><LazyPage><SmartMatchingPage /></LazyPage></ProtectedRoute>} />
        <Route path="/cognitive" element={<ProtectedRoute><LazyPage><CognitivePage /></LazyPage></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><LazyPage><CoachPage /></LazyPage></ProtectedRoute>} />
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingSkeleton />;
  }

  return (
    <AppShell>
      <AnimatedRoutes />
    </AppShell>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
  </ErrorBoundary>
);

export default App;
