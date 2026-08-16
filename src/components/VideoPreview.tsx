import { useState, useEffect } from 'react';
import { Download, Loader2, Clock, Play, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoInfo, VideoMedia } from '@/types/video';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  video: VideoInfo;
  onDownload: (media: VideoMedia) => void;
  isDownloading: boolean;
}

export function VideoPreview({ video, onDownload, isDownloading }: VideoPreviewProps) {
  const [selectedMedia, setSelectedMedia] = useState<VideoMedia | null>(null);
  const [hasSelected, setHasSelected] = useState(false);

  // Reset selection state when the video info changes (require explicit selection)
  useEffect(() => {
    setSelectedMedia(null);
    setHasSelected(false);
  }, [video]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = () => {
    if (selectedMedia) {
      onDownload(selectedMedia);
    }
  };

  return (
    <Card className="w-full overflow-hidden glass-card rounded-2xl animate-fade-up">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="relative md:w-2/5 aspect-video md:aspect-auto overflow-hidden bg-secondary">
          {!imageError ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center min-h-[200px]">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Loading skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-secondary animate-pulse" />
          )}
          
          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-sm font-medium backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5" />
              {video.duration}
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-5 md:p-6 flex flex-col">
          <div className="flex-1">
            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-3 capitalize">
              {video.platform}
            </span>
            
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-4">
              {video.title || 'Untitled Video'}
            </h3>

            {/* Quality selection */}
            {video.media.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">Select Quality</Label>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary">
                    {video.media.length} options available
                  </span>
                </div>

                {video.media.length <= 4 ? (
                  /* Radio selector for fewer options */
                  <RadioGroup 
                    value={selectedMedia ? video.media.indexOf(selectedMedia).toString() : ""} 
                    onValueChange={(val) => { setSelectedMedia(video.media[parseInt(val)]); setHasSelected(true); }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {video.media.map((media, index) => (
                      <div key={index}>
                        <RadioGroupItem
                          value={index.toString()}
                          id={`quality-${index}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`quality-${index}`}
                          className={cn(
                            "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                            selectedMedia === media && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold">
                              {media.quality || media.format || `Option ${index + 1}`}
                            </span>
                            {media.size && (
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {media.size}
                              </span>
                            )}
                          </div>
                          {selectedMedia === media && (
                            <Check className="w-3 h-3 text-primary mt-1" />
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  /* Dropdown for many options */
                  <Select
                    value={selectedMedia ? video.media.indexOf(selectedMedia).toString() : undefined}
                    onValueChange={(val) => { setSelectedMedia(video.media[parseInt(val)]); setHasSelected(true); }}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl border-2 bg-secondary/30">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {video.media.map((media, index) => (
                        <SelectItem key={index} value={index.toString()} className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {media.quality || media.format || `Option ${index + 1}`}
                            </span>
                            {media.size && (
                              <span className="text-xs text-muted-foreground">
                                ({media.size})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            disabled={!hasSelected || !selectedMedia || isDownloading}
            className={cn(
              "mt-5 h-12 text-base font-medium rounded-xl",
              "gradient-btn text-primary-foreground",
              "transition-all duration-300",
              "hover:shadow-lg hover:shadow-primary/25"
            )}
          >
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing download...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {selectedMedia ? `Download ${selectedMedia.quality || selectedMedia.format || 'Video'}` : 'Select quality to download'}
              </span>

            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
