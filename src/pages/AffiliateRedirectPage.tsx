import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import AppLoadingSkeleton from "@/components/PageSkeleton";
import { captureReferral } from "@/lib/affiliate";

const RESERVED_SLUGS = new Set([
  "admin",
  "appointments",
  "auth",
  "badges",
  "coach",
  "coming-soon",
  "community",
  "cognitive",
  "energy",
  "features-roadmap",
  "insights",
  "journal",
  "learn",
  "lifestyle",
  "matching",
  "medications",
  "messages",
  "my-ms-history",
  "notifications",
  "nervous-system",
  "onboarding",
  "premium",
  "privacy",
  "profile",
  "relapses",
  "reports",
  "reset-password",
  "risk-history",
  "success",
  "terms",
  "today",
  "track",
  "unsubscribe",
  "wearables",
]);

const AffiliateRedirectPage = ({ source }: { source: "ref-path" | "slug-path" }) => {
  const { refSlug } = useParams<{ refSlug: string }>();
  const [readyToRedirect, setReadyToRedirect] = useState(false);
  const normalizedSlug = useMemo(() => refSlug?.trim().toLowerCase() ?? "", [refSlug]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!normalizedSlug) {
        if (!cancelled) setReadyToRedirect(true);
        return;
      }

      if (source === "slug-path" && RESERVED_SLUGS.has(normalizedSlug)) {
        if (!cancelled) setReadyToRedirect(true);
        return;
      }

      await captureReferral(normalizedSlug, {
        source,
        pathSlug: normalizedSlug,
      });

      if (!cancelled) {
        setReadyToRedirect(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [normalizedSlug, source]);

  if (!readyToRedirect) {
    return <AppLoadingSkeleton />;
  }

  if (!normalizedSlug || (source === "slug-path" && RESERVED_SLUGS.has(normalizedSlug))) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/?ref=${encodeURIComponent(normalizedSlug)}`} replace />;
};

export default AffiliateRedirectPage;
