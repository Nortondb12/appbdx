import { cn } from "@/lib/utils";
import { Globe, Youtube, Instagram, Music, Facebook } from "lucide-react";

export type PlatformTab = "all" | "youtube" | "instagram" | "tiktok" | "facebook";

interface PlatformTabsProps {
  selectedPlatform: PlatformTab;
  onSelectPlatform: (platform: PlatformTab) => void;
}

const platforms: { id: PlatformTab; name: string; icon: React.ReactNode }[] = [
  { id: "all", name: "All", icon: <Globe className="w-4 h-4" /> },
  { id: "youtube", name: "YouTube", icon: <Youtube className="w-4 h-4" /> },
  { id: "instagram", name: "Instagram", icon: <Instagram className="w-4 h-4" /> },
  { id: "tiktok", name: "TikTok", icon: <Music className="w-4 h-4" /> },
  { id: "facebook", name: "Facebook", icon: <Facebook className="w-4 h-4" /> },
];

export function PlatformTabs({ selectedPlatform, onSelectPlatform }: PlatformTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 p-1.5 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => onSelectPlatform(platform.id)}
          className={cn(
            "relative px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-500",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selectedPlatform === platform.id
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="text-base">{platform.icon}</span>
            <span className="hidden sm:inline">{platform.name}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
