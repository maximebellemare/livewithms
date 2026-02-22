import { Skeleton } from "@/components/ui/skeleton";

/** Generic full-page loading skeleton used by ProtectedRoute / AppRoutes */
export const AppLoadingSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-32 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-48 rounded-md" />
    </div>
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  </div>
);

/** Card list skeleton — good for Medications, Appointments, Journal past entries */
export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 card-base">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

/** Insights / chart-heavy skeleton */
export const InsightsSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {/* Range toggle pills */}
    <div className="flex gap-2">
      <Skeleton className="h-9 w-28 rounded-full" />
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
    {/* Stat cards grid */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-4 shadow-soft text-center space-y-2">
          <Skeleton className="h-6 w-6 rounded-md mx-auto" />
          <Skeleton className="h-7 w-12 rounded-md mx-auto" />
          <Skeleton className="h-3 w-16 rounded-md mx-auto" />
          <Skeleton className="h-5 w-14 rounded-full mx-auto" />
        </div>
      ))}
    </div>
    {/* Heatmap */}
    <Skeleton className="h-56 rounded-2xl" />
    {/* Weekly progress summary */}
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-40 rounded-md" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-md flex-shrink-0" />
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-3 flex-1 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
    {/* Trend chart */}
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-32 rounded-md" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
    {/* AI insight card */}
    <Skeleton className="h-28 rounded-2xl" />
    {/* Medication adherence */}
    <Skeleton className="h-40 rounded-2xl" />
  </div>
);

/** Journal editor skeleton */
export const JournalEditorSkeleton = () => (
  <div className="rounded-2xl bg-card border border-border p-5 space-y-3 animate-fade-in">
    <Skeleton className="h-5 w-40 rounded-md" />
    <Skeleton className="h-24 rounded-lg" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  </div>
);

/** Relapses page skeleton */
export const RelapsesSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
      ))}
    </div>
    <CardListSkeleton count={3} />
  </div>
);

/* ─── Page-specific skeletons ────────────────────────────── */

/** Today page: header + streaks + sparkline grid + cards */
export const TodaySkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-40 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg space-y-3 px-4 py-3">
      {/* Streak badges */}
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
      {/* Sparkline grid */}
      <Skeleton className="h-4 w-40 rounded-md" />
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {/* Quick log + cards */}
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  </div>
);

/** Track page: month nav + calendar heatmap + summary */
export const TrackSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <Skeleton className="mt-1.5 h-4 w-36 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  </div>
);

/** Community page: trending + channels list */
export const CommunitySkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-32 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-28 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      <Skeleton className="h-5 w-40 rounded-md" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-44 flex-shrink-0 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-5 w-32 rounded-md" />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  </div>
);

/** Coach page: disclaimer + 4 mode cards */
export const CoachSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-28 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-52 rounded-md" />
    </div>
    <div className="mx-4 mb-4 mt-4">
      <Skeleton className="h-12 rounded-xl" />
    </div>
    <div className="px-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Learn page: search + filters + article cards */
export const LearnSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-20 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-48 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-3">
      <Skeleton className="h-10 rounded-xl" />
      <div className="flex gap-2">
        {["All", "Basics", "Treatment"].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  </div>
);

/** Profile page: avatar card + nav links + settings sections */
export const ProfileSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-48 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      {/* User info card */}
      <div className="card-base space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
        </div>
        {/* Nav links inside card */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
      {/* Weekly goal card */}
      <div className="card-base space-y-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-3 flex-1 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>
      {/* Display name section */}
      <div className="card-base space-y-2">
        <Skeleton className="h-4 w-36 rounded-md" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      {/* MS details section */}
      <div className="card-base space-y-2">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      {/* Theme / notifications */}
      <div className="card-base flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
    </div>
  </div>
);

/** Messages page: conversation list */
export const MessagesSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-28 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-36 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Cognitive page: streak + best scores + tabs */
export const CognitiveSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-40 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-36 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      <Skeleton className="h-14 rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 flex-1 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  </div>
);

/** Lifestyle page: tabs + checklist items */
export const LifestyleSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-52 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-secondary p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded-md" />
        ))}
      </div>
      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      {/* List items */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-soft">
          <Skeleton className="h-4 w-4 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-3 w-44 rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-3.5 rounded-sm" />
        </div>
      ))}
    </div>
  </div>
);

/** Reports page: hero + presets + date range + toggles + actions */
export const ReportsSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-40 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      {/* Hero card */}
      <div className="rounded-xl bg-card p-5 text-center space-y-3">
        <Skeleton className="h-14 w-14 rounded-full mx-auto" />
        <Skeleton className="h-5 w-44 rounded-md mx-auto" />
        <Skeleton className="h-3 w-64 rounded-md mx-auto" />
      </div>
      {/* Quick select presets */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Date range card */}
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <Skeleton className="h-4 w-24 rounded-md" />
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-2.5 w-10 rounded-md" />
            <Skeleton className="h-9 rounded-lg" />
          </div>
          <div className="flex-1 space-y-1">
            <Skeleton className="h-2.5 w-10 rounded-md" />
            <Skeleton className="h-9 rounded-lg" />
          </div>
        </div>
      </div>
      {/* Include toggles */}
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <Skeleton className="h-4 w-32 rounded-md" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-3.5 flex-1 rounded-md" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
        ))}
      </div>
      {/* Action buttons */}
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-12 rounded-xl" />
    </div>
  </div>
);

/** Badges page: summary card + view toggle + category grids */
export const BadgesSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-44 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-6">
      {/* Summary card */}
      <div className="rounded-2xl bg-card p-5 shadow-soft text-center space-y-2">
        <Skeleton className="h-8 w-8 rounded-md mx-auto" />
        <Skeleton className="h-7 w-20 rounded-md mx-auto" />
        <Skeleton className="h-3 w-24 rounded-md mx-auto" />
        <Skeleton className="h-2 w-[200px] rounded-full mx-auto" />
      </div>
      {/* View toggle */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      {/* Category grids */}
      {Array.from({ length: 3 }).map((_, cat) => (
        <div key={cat} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-4 text-center space-y-2">
                <Skeleton className="h-8 w-8 rounded-md mx-auto" />
                <Skeleton className="h-3 w-16 rounded-md mx-auto" />
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Energy Budget page: spoon meter + activity list + history + tip */
export const EnergyBudgetSkeleton = () => (
  <div className="animate-fade-in">
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-36 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-44 rounded-md" />
    </div>
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      {/* Spoon meter */}
      <div className="rounded-xl bg-card p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3 rounded-full" />
        <div className="flex gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-5 rounded-sm" />
          ))}
        </div>
      </div>
      {/* Activities card */}
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5">
            <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
            <Skeleton className="h-3.5 flex-1 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-md" />
          </div>
        ))}
      </div>
      {/* History */}
      <div className="rounded-xl bg-card p-4 shadow-soft">
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
      {/* Tip card */}
      <Skeleton className="h-24 rounded-xl" />
    </div>
  </div>
);

export default AppLoadingSkeleton;
