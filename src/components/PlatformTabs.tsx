import { cn } from "@/lib/utils";

export type PlatformTab = "all" | "youtube" | "instagram" | "tiktok" | "facebook";

interface PlatformTabsProps {
  selectedPlatform: PlatformTab;
  onSelectPlatform: (platform: PlatformTab) => void;
}

const platforms: { id: PlatformTab; name: string; icon: string }[] = [
  { id: "all", name: "All", icon: "🌐" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "facebook", name: "Facebook", icon: "👤" },
];

export function PlatformTabs({ selectedPlatform, onSelectPlatform }: PlatformTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-secondary/30 dark:bg-secondary/20 backdrop-blur-sm rounded-full">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => onSelectPlatform(platform.id)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300",
            "hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selectedPlatform === platform.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
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
