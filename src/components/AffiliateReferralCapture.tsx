import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { captureReferral } from "@/lib/affiliate";

const AffiliateReferralCapture = () => {
  const location = useLocation();
  const lastCaptureKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get("ref");
    if (!ref) return;

    const captureKey = `${location.pathname}${location.search}`;
    if (lastCaptureKeyRef.current === captureKey) return;
    lastCaptureKeyRef.current = captureKey;

    void captureReferral(ref, {
      source: "query",
      path: location.pathname,
      search: location.search,
    });
  }, [location.pathname, location.search]);

  return null;
};

export default AffiliateReferralCapture;
