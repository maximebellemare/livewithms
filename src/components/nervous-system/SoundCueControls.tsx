import { Volume2, Music } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SoundCueControlsProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  ambientOn: boolean;
  onToggleAmbient: () => void;
  /** Hide ambient toggle for short exercises */
  showAmbient?: boolean;
}

/**
 * Compact controls row for sound‑cue & ambient‑music toggles.
 * Shared across Regulation Center exercises.
 */
const SoundCueControls = ({
  enabled,
  onEnabledChange,
  ambientOn,
  onToggleAmbient,
  showAmbient = true,
}: SoundCueControlsProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Sound cues</span>
      </div>
      <Switch checked={enabled} onCheckedChange={onEnabledChange} />
    </div>
    {enabled && showAmbient && (
      <div className="flex items-center justify-between pl-5">
        <div className="flex items-center gap-1.5">
          <Music className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Ambient background</span>
        </div>
        <Switch checked={ambientOn} onCheckedChange={onToggleAmbient} />
      </div>
    )}
  </div>
);

export default SoundCueControls;
