import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";
import OfflineBanner from "./OfflineBanner";
import OnboardingTooltips from "./OnboardingTooltips";
import WhatsNewBanner from "./WhatsNewBanner";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  const showNav = !location.pathname.startsWith("/onboarding") && location.pathname !== "/" && location.pathname !== "/auth";

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <main id="main-content" className={showNav ? "pb-20" : ""} role="main">
        {children}
      </main>
      <BottomNav />
      <InstallPrompt />
      {showNav && <WhatsNewBanner />}
      {showNav && location.pathname === "/today" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_v1"
          steps={[
            { target: "sparklines", title: "Your week at a glance", description: "These sparklines show your symptom trends over the past 7 days. Tap any card to log quickly, or hold to dive into detailed insights.", position: "bottom" },
            { target: "quick-log", title: "Log your symptoms", description: "Slide each symptom to rate how you're feeling today. Your weekly average is shown for comparison.", position: "top" },
            { target: "mood-tags", title: "Tag your mood", description: "Add tags to capture the nuances of how you're feeling — they'll help spot patterns over time.", position: "top" },
            { target: "reminders", title: "Medications & appointments", description: "Quick access to manage your medication schedule and upcoming visits — all in one place.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/track" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_track_v1"
          steps={[
            { target: "track-month-nav", title: "Browse by month", description: "Tap the arrows to move between months and review your full symptom history over time.", position: "bottom" },
            { target: "track-heatmap", title: "Your symptom calendar", description: "Each cell is colour-coded by severity. Tap any day to see a detailed breakdown of all your logged symptoms.", position: "bottom" },
            { target: "track-summary", title: "Monthly summary", description: "A quick overview of how many days you logged, your average severity, and your best and hardest days of the month.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/insights" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_insights_v1"
          steps={[
            { target: "insights-range", title: "Choose your time window", description: "Switch between the last 7 or 30 days to zoom in on recent trends or get a broader picture of your health.", position: "bottom" },
            { target: "insights-stats", title: "Symptom snapshot", description: "Each card shows your average for that symptom and whether it's trending up, down, or staying stable. Tap a card to focus the chart on that symptom.", position: "bottom" },
            { target: "insights-heatmap", title: "30-day heatmap", description: "Spot patterns at a glance — brighter cells mean higher severity. Tap any day to drill into the details.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/community" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_community_v1"
          steps={[
            { target: "community-trending", title: "What's trending", description: "The most-reacted posts from across the community — a great place to discover conversations that matter.", position: "bottom" },
            { target: "community-channels", title: "Browse channels", description: "31 topic channels organised by category. Tap any channel to read posts, share your experience, or offer support.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/medications" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_medications_v1"
          steps={[
            { target: "meds-add-btn", title: "Add a medication", description: "Tap + to add any MS treatment — daily pills, custom schedules, or infusion therapies like Ocrevus every 6 months.", position: "bottom" },
            { target: "meds-list", title: "Your medication list", description: "Each card shows your medication name, dosage, and schedule. Tap the pencil to edit or the bin to remove. Dose logging happens on the Today page.", position: "bottom" },
          ]}
        />
      )}

      {showNav && location.pathname === "/relapses" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_relapses_v1"
          steps={[
            { target: "relapses-summary", title: "Your relapse history", description: "See your total relapses logged, any ongoing flare-ups, and when your most recent relapse started — all at a glance.", position: "bottom" },
            { target: "relapses-log-btn", title: "Log a relapse", description: "Tap here to record a new flare-up. You can capture start/end dates, severity, symptoms, triggers, treatment, and personal notes.", position: "bottom" },
            { target: "relapses-list", title: "Your relapse timeline", description: "Each card shows duration, severity, and symptoms. Tap the chevron to expand full details, edit an entry, or delete it.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/journal" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_journal_v1"
          steps={[
            { target: "journal-editor", title: "Write today's entry", description: "Use the daily rotating prompt for inspiration, or write freely. Your notes are saved privately and linked to your symptom data.", position: "bottom" },
            { target: "journal-week", title: "This week in reflection", description: "See all your reflections from this week at a glance. Logging every day builds a streak and helps you spot emotional patterns over time.", position: "top" },
          ]}
        />
      )}
    </div>
  );
};

export default AppShell;

