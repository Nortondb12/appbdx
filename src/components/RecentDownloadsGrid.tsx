import { Trash2, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadHistoryItem } from "@/types/video";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RecentDownloadsGridProps {
  history: DownloadHistoryItem[];
  onClear: () => void;
}

const platformColors: Record<string, string> = {
  youtube: "bg-red-500",
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  tiktok: "bg-black dark:bg-white dark:text-black",
  facebook: "bg-blue-600",
  twitter: "bg-sky-500",
  unknown: "bg-primary",
};

export function RecentDownloadsGrid({ history, onClear }: RecentDownloadsGridProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No downloads yet</p>
        <p className="text-sm text-muted-foreground/70">Your recent downloads will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Downloads</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Horizontal scrollable grid */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {history.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex-shrink-0 w-72 rounded-2xl overflow-hidden",
                "glass-card border-white/10 hover:border-white/30",
                "transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
                "snap-start"
              )}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-secondary overflow-hidden">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Download className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Platform badge */}
                <div
                  className={cn(
                    "absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white capitalize",
                    platformColors[item.platform] || platformColors.unknown
                  )}
                >
                  {item.platform}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(item.downloadedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Fade edges */}
        <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
