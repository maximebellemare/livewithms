import { useState, useMemo } from "react";
import { ChevronDown, Lock, Shield } from "lucide-react";
import { Channel } from "@/hooks/useCommunity";
import { ModPanel } from "./ModPanel";

export const ChannelList = ({
  channels, onSelect, roles,
}: { channels: Channel[]; onSelect: (ch: Channel) => void; roles: string[] }) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Channel[]>();
    channels.forEach((ch) => {
      const arr = map.get(ch.category) || [];
      arr.push(ch);
      map.set(ch.category, arr);
    });
    return map;
  }, [channels]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (cat: string) => setCollapsed((s) => {
    const next = new Set(s);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    return next;
  });

  const isMod = roles.includes("admin") || roles.includes("moderator");

  return (
    <div className="space-y-4 animate-fade-in">
      {isMod && <ModPanel />}
      {Array.from(grouped.entries()).map(([category, chs]) => (
        <div key={category}>
          <button
            onClick={() => toggle(category)}
            className="flex w-full items-center justify-between mb-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </p>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${collapsed.has(category) ? "" : "rotate-180"}`} />
          </button>
          {!collapsed.has(category) && (
            <div className="space-y-2">
              {chs.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onSelect(ch)}
                  className="tap-highlight-none flex w-full items-center gap-3 rounded-xl bg-card p-3 shadow-soft transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-base">
                    {ch.emoji}
                  </span>
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{ch.name}</p>
                      {ch.is_locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    {ch.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{ch.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="mt-4 rounded-xl bg-accent p-4 text-center">
        <p className="text-xs text-accent-foreground">
          💛 This is a safe, moderated space. Be kind, be supportive.
        </p>
      </div>
    </div>
  );
};
