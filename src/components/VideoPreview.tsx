import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlatformIcon } from '@/components/PlatformIcon';
import { VideoInfo, VideoMedia } from '@/types/video';
import { useState } from 'react';

interface VideoPreviewProps {
  video: VideoInfo;
  onDownload: (media: VideoMedia) => void;
  isDownloading: boolean;
}

export function VideoPreview({ video, onDownload, isDownloading }: VideoPreviewProps) {
  const [selectedQuality, setSelectedQuality] = useState<VideoMedia | null>(
    video.media[0] || null
  );

  const handleDownload = () => {
    if (selectedQuality) {
      onDownload(selectedQuality);
    }
  };

  return (
    <Card className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-3 left-3">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
              <PlatformIcon platform={video.platform} size={20} />
            </div>
          </div>
          {video.duration && (
            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-sm">
              {video.duration}
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-lg line-clamp-2">{video.title || 'Untitled Video'}</h3>

          {video.media.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select Quality:</p>
              <div className="flex flex-wrap gap-2">
                {video.media.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedQuality(media)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedQuality === media
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {media.quality || media.format || `Option ${index + 1}`}
                    {media.size && ` (${media.size})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={!selectedQuality || isDownloading}
            className="w-full h-12 text-base font-semibold gradient-btn border-0"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download Video
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
