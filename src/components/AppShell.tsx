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
          storageKey="onboarding_tour_insights_v2"
          steps={[
            { target: "insights-range", title: "Choose your time window", description: "Switch between the last 7 days for a close-up view of recent changes, or 30 days for a broader picture of your health trends.", position: "bottom" },
            { target: "insights-stats", title: "Symptom snapshot", description: "Each card shows your average score and whether that symptom is trending higher, lower, or staying stable vs the previous period. Tap a card to isolate that symptom on the chart below.", position: "bottom" },
            { target: "insights-heatmap", title: "30-day heatmap", description: "A colour-coded grid of every day's logged severity. Brighter cells mean higher intensity. Tap any cell to drill into that day's full entry. Best and toughest weeks are highlighted automatically.", position: "top" },
            { target: "insights-risk", title: "Relapse risk indicator", description: "Compares your last 7 days against the 7 days before to generate a risk score (Low → High). A 4-week sparkline shows how your risk has trended — contributing factors are listed below the score.", position: "top" },
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

      {showNav && location.pathname === "/learn" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_learn_v2"
          steps={[
            { target: "learn-progress", title: "Track your progress", description: "The progress bar shows how many articles you've completed out of the full curriculum. Finishing all articles triggers a confetti celebration! 🎉", position: "bottom" },
            { target: "learn-filters", title: "Filter & search", description: "Browse by category (MS Basics, Treatments, Lifestyle…), or use the Saved, Unread, and Completed filters to jump to exactly what you need.", position: "bottom" },
            { target: "learn-articles", title: "Read & bookmark", description: "Tap any article to expand it and start reading. A progress bar tracks how far you've scrolled. Tap the bookmark icon to save articles for later.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/reports" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_reports_v1"
          steps={[
            { target: "reports-hero", title: "Doctor-Ready Reports", description: "Generate a professional PDF summary of your MS health data — symptoms, medications, appointments, journal notes, and an AI-generated insight — all formatted for your neurologist.", position: "bottom" },
            { target: "reports-sections", title: "Customise your report", description: "Toggle each section on or off to control exactly what's included. Pick a quick preset (7, 30, or 90 days) or set a custom date range for the reporting period.", position: "bottom" },
            { target: "reports-actions", title: "Generate & send", description: "Tap 'Generate PDF Report' to download instantly. If you've saved your neurologist's email in your Profile, a 'Send to Neurologist' button will appear to email the report directly.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/appointments" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_appointments_v1"
          steps={[
            { target: "appts-add-btn", title: "Schedule an appointment", description: "Tap + to log any upcoming visit — neurology, MRI, infusion, physiotherapy, and more. Add a time, location, and prep notes.", position: "bottom" },
            { target: "appts-view-toggle", title: "Calendar or list view", description: "Switch between a calendar to tap specific days and a full list of all your upcoming appointments.", position: "bottom" },
            { target: "appts-list", title: "Your appointments", description: "Each card shows the type, date, time, and location. Tap the pencil to edit or the bin to remove an entry.", position: "top" },
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
          storageKey="onboarding_tour_relapses_v2"
          steps={[
            { target: "relapses-summary", title: "Your relapse history", description: "See your total relapses logged, any active flare-ups, and the date of your most recent relapse — all at a glance.", position: "bottom" },
            { target: "relapses-log-btn", title: "Log a new flare-up", description: "Tap here to record a relapse. Set start and end dates, pick a severity level (mild → critical), select your symptoms, note any triggers like stress or heat, and add treatment details.", position: "bottom" },
            { target: "relapses-list", title: "Track your recovery", description: "Each card shows duration, severity badge, and symptoms. Tap the chevron to expand and see triggers, treatment, and notes — or edit and update the entry as you recover.", position: "top" },
          ]}
        />
      )}

      {showNav && location.pathname === "/journal" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_journal_v3"
          steps={[
            { target: "journal-editor", title: "Write today's entry", description: "Each day starts fresh — write freely about how you're feeling. Entries are saved privately and paired with your logged symptoms for a complete picture of your health.", position: "bottom" },
            { target: "journal-prompt", title: "Daily prompt & AI suggestions", description: "A new reflection question rotates in every day for inspiration — tap 'Use this prompt' to drop it straight into your entry. AI-powered suggestions based on your recent logs also appear below.", position: "bottom" },
            { target: "journal-week", title: "Build your streak", description: "Every reflection earns a 💭 badge. Log consistently to level up to ⚡ (1-2 weeks) and 🔥 (3+ weeks). Saving your first reflection of the week triggers a confetti celebration!", position: "top" },
          ]}
        />
      )}
    </div>
  );
};

export default AppShell;

