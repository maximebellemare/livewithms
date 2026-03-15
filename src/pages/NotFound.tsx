import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <span className="text-4xl">🧭</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page doesn't seem to exist. Let's get you back on track.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.97] tap-target"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
