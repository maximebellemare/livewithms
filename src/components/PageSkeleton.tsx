import { Skeleton } from "@/components/ui/skeleton";

/** Generic full-page loading skeleton used by ProtectedRoute / AppRoutes */
export const AppLoadingSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-background">
    {/* Header area */}
    <div className="px-4 pt-6 pb-2">
      <Skeleton className="h-7 w-32 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-48 rounded-md" />
    </div>
    {/* Content cards */}
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-48 rounded-xl" />
    <Skeleton className="h-64 rounded-xl" />
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

export default AppLoadingSkeleton;
