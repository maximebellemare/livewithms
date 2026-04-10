import { lazy, Suspense, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLoadingSkeleton, {
  TodaySkeleton,
  TrackSkeleton,
  CommunitySkeleton,
  CoachSkeleton,
  LearnSkeleton,
  ProfileSkeleton,
  MessagesSkeleton,
  CognitiveSkeleton,
  InsightsSkeleton,
  CardListSkeleton,
  JournalEditorSkeleton,
  RelapsesSkeleton,
  BadgesSkeleton,
  EnergyBudgetSkeleton,
  LifestyleSkeleton,
  ReportsSkeleton,
} from "@/components/PageSkeleton";
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
const WearablesPage = lazy(() => import("./pages/WearablesPage"));
const CoachPage = lazy(() => import("./pages/CoachPage"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const NervousSystemPage = lazy(() => import("./pages/NervousSystemPage"));
const RiskHistoryPage = lazy(() => import("./pages/RiskHistoryPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));

const queryClient = new QueryClient();
// Configure QueryClient with WebView-safe defaults
queryClient.setDefaultOptions({
  queries: {
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) return false;
      }
      // Retry up to 2 times for network errors (common in WebView)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    staleTime: 30_000, // 30s — reduces refetches on WebView resume
  },
});

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

const LazyPage = ({ children, fallback }: { children: React.ReactNode; fallback?: ReactNode }) => (
  <Suspense fallback={fallback ?? <AppLoadingSkeleton />}>
    <AnimatedPage>{children}</AnimatedPage>
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={user ? <Navigate to="/today" replace /> : <AnimatedPage><Index /></AnimatedPage>} />
        <Route path="/auth" element={user ? <Navigate to="/today" replace /> : <AnimatedPage><AuthPage /></AnimatedPage>} />
        <Route path="/reset-password" element={<LazyPage><ResetPasswordPage /></LazyPage>} />
        <Route path="/onboarding" element={<ProtectedRoute><LazyPage><OnboardingPage /></LazyPage></ProtectedRoute>} />
        <Route path="/today" element={<ProtectedRoute><LazyPage fallback={<TodaySkeleton />}><TodayPage /></LazyPage></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><LazyPage fallback={<TrackSkeleton />}><TrackPage /></LazyPage></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><LazyPage fallback={<InsightsSkeleton />}><InsightsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LazyPage fallback={<LearnSkeleton />}><LearnPage /></LazyPage></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><LazyPage fallback={<CommunitySkeleton />}><CommunityPage /></LazyPage></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><LazyPage fallback={<JournalEditorSkeleton />}><JournalPage /></LazyPage></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><LazyPage fallback={<ProfileSkeleton />}><ProfilePage /></LazyPage></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><LazyPage fallback={<CardListSkeleton />}><MedicationsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><LazyPage fallback={<CardListSkeleton />}><AppointmentsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><LazyPage fallback={<ReportsSkeleton />}><ReportsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><LazyPage><PrivacyPage /></LazyPage></ProtectedRoute>} />
        <Route path="/notifications/settings" element={<ProtectedRoute><LazyPage><NotificationSettingsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/my-ms-history" element={<ProtectedRoute><LazyPage><MyMSHistoryPage /></LazyPage></ProtectedRoute>} />
        <Route path="/relapses" element={<ProtectedRoute><LazyPage fallback={<RelapsesSkeleton />}><RelapsesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/community/guidelines" element={<ProtectedRoute><LazyPage><CommunityGuidelinesPage /></LazyPage></ProtectedRoute>} />
        
        <Route path="/coming-soon/:feature" element={<ProtectedRoute><LazyPage><ComingSoonPage /></LazyPage></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><LazyPage><AdminPage /></LazyPage></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><LazyPage><TermsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><LazyPage fallback={<BadgesSkeleton />}><BadgesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><LazyPage fallback={<MessagesSkeleton />}><MessagesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/energy" element={<ProtectedRoute><LazyPage fallback={<EnergyBudgetSkeleton />}><EnergyBudgetPage /></LazyPage></ProtectedRoute>} />
        <Route path="/lifestyle" element={<ProtectedRoute><LazyPage fallback={<LifestyleSkeleton />}><LifestylePage /></LazyPage></ProtectedRoute>} />
        <Route path="/matching" element={<ProtectedRoute><LazyPage><SmartMatchingPage /></LazyPage></ProtectedRoute>} />
        <Route path="/cognitive" element={<ProtectedRoute><LazyPage fallback={<CognitiveSkeleton />}><CognitivePage /></LazyPage></ProtectedRoute>} />
        <Route path="/wearables" element={<ProtectedRoute><LazyPage><WearablesPage /></LazyPage></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><LazyPage fallback={<CoachSkeleton />}><CoachPage /></LazyPage></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><LazyPage><PremiumPage /></LazyPage></ProtectedRoute>} />
        <Route path="/nervous-system" element={<ProtectedRoute><LazyPage><NervousSystemPage /></LazyPage></ProtectedRoute>} />
        <Route path="/risk-history" element={<ProtectedRoute><LazyPage><RiskHistoryPage /></LazyPage></ProtectedRoute>} />
        <Route path="/success" element={<ProtectedRoute><LazyPage><SuccessPage /></LazyPage></ProtectedRoute>} />
        <Route path="/unsubscribe" element={<LazyPage><UnsubscribePage /></LazyPage>} />
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
