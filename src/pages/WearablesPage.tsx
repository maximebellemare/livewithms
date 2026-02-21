import { Watch, Smartphone, Activity, Heart, Moon, Footprints, ArrowRight, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Wearable {
  id: string;
  name: string;
  logo: React.ReactNode;
  description: string;
  metrics: string[];
  connected: boolean;
}

const wearables: Wearable[] = [
  {
    id: "apple-health",
    name: "Apple Health",
    logo: <Smartphone className="h-7 w-7" />,
    description: "Sync steps, heart rate, sleep, and activity data from your iPhone and Apple Watch.",
    metrics: ["Steps", "Heart Rate", "Sleep", "Activity"],
    connected: false,
  },
  {
    id: "fitbit",
    name: "Fitbit",
    logo: <Activity className="h-7 w-7" />,
    description: "Connect your Fitbit tracker to import steps, sleep quality, and heart rate data.",
    metrics: ["Steps", "Sleep", "Heart Rate", "Calories"],
    connected: false,
  },
  {
    id: "garmin",
    name: "Garmin",
    logo: <Watch className="h-7 w-7" />,
    description: "Pull in activity, stress, and body battery data from your Garmin device.",
    metrics: ["Steps", "Stress", "Body Battery", "Heart Rate"],
    connected: false,
  },
];

const metricIcons: Record<string, React.ReactNode> = {
  Steps: <Footprints className="h-3.5 w-3.5" />,
  "Heart Rate": <Heart className="h-3.5 w-3.5" />,
  Sleep: <Moon className="h-3.5 w-3.5" />,
  Activity: <Activity className="h-3.5 w-3.5" />,
  Calories: <Activity className="h-3.5 w-3.5" />,
  Stress: <Activity className="h-3.5 w-3.5" />,
  "Body Battery": <Activity className="h-3.5 w-3.5" />,
};

const WearablesPage = () => {
  const handleConnect = (name: string) => {
    toast.info(`${name} integration coming soon! We'll notify you when it's ready.`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Wearables" showBack />

      <div className="mx-auto max-w-lg px-4 space-y-6">
        {/* Hero section */}
        <div className="rounded-2xl bg-card p-5 shadow-soft text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Watch className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Connect Your Devices</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Link your wearable devices to automatically enrich your health logs with steps, heart rate, sleep, and more.
          </p>
        </div>

        {/* Wearable cards */}
        <div className="space-y-3">
          {wearables.map((w) => (
            <Card key={w.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {w.logo}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{w.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{w.description}</p>
                </div>
              </div>

              {/* Metrics chips */}
              <div className="flex flex-wrap gap-1.5">
                {w.metrics.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                  >
                    {metricIcons[m]}
                    {m}
                  </span>
                ))}
              </div>

              {/* Connect button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleConnect(w.name)}
              >
                {w.connected ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Connected
                  </>
                ) : (
                  <>
                    Connect {w.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* What happens next */}
        <div className="rounded-xl bg-muted/50 p-4 text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What happens next?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Once connected, your wearable data will automatically appear in your daily logs, insights, and reports — giving you and your neurologist a fuller picture of your health.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WearablesPage;
