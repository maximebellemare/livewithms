import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateToken(token);
  }, [token]);

  const validateToken = async (t: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${t}`,
        { headers: { apikey: anonKey } }
      );
      const data = await res.json();
      if (!res.ok) {
        setStatus("invalid");
      } else if (data.valid === false && data.reason === "already_unsubscribed") {
        setStatus("already");
      } else if (data.valid) {
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    } catch {
      setStatus("invalid");
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "handle-email-unsubscribe",
        { body: { token } }
      );
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Validating your request…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <MailX className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
            <p className="text-muted-foreground">
              Are you sure you want to unsubscribe from LiveWithMS app emails?
              You'll still receive important account emails like password resets.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={confirming}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-all disabled:opacity-50"
            >
              {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Unsubscribe
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground">
              You've been unsubscribed from LiveWithMS app emails. You'll still
              receive essential account emails.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Already unsubscribed</h1>
            <p className="text-muted-foreground">
              You've already been unsubscribed from these emails.
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Invalid link</h1>
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has expired. If you need help,
              contact{" "}
              <a
                href="mailto:support@livewithms.com"
                className="text-primary underline"
              >
                support@livewithms.com
              </a>
              .
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              We couldn't process your request. Please try again or contact{" "}
              <a
                href="mailto:support@livewithms.com"
                className="text-primary underline"
              >
                support@livewithms.com
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
