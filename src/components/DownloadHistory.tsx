import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformIcon } from '@/components/PlatformIcon';
import { DownloadHistoryItem } from '@/types/video';
import { formatDistanceToNow } from 'date-fns';

interface DownloadHistoryProps {
  history: DownloadHistoryItem[];
  onClear: () => void;
}

export function DownloadHistory({ history, onClear }: DownloadHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Download History</span>
          <span className="text-sm text-muted-foreground">({history.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 glass-card rounded-xl"
            >
              <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute bottom-0.5 right-0.5">
                  <PlatformIcon platform={item.platform} size={12} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.downloadedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            onClick={onClear}
            className="w-full mt-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </div>
      )}
    </div>
  );
}
