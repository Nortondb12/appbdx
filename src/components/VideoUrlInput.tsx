import { useState, useEffect } from 'react';
import { Link, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlatformIcon } from '@/components/PlatformIcon';
import { detectPlatform } from '@/utils/platformDetector';
import { Platform } from '@/types/video';

interface VideoUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string;
}

export function VideoUrlInput({ onSubmit, isLoading, error }: VideoUrlInputProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    setPlatform(detectPlatform(url));
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {platform !== 'unknown' ? (
            <PlatformIcon platform={platform} size={20} />
          ) : (
            <Link className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste video link here…"
          className="pl-12 pr-4 h-14 text-lg bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-destructive text-sm animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={!url.trim() || isLoading}
        className="w-full h-14 text-lg font-semibold gradient-btn border-0"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Fetching Video...
          </>
        ) : (
          'Download'
        )}
      </Button>

      {platform !== 'unknown' && (
        <p className="text-center text-sm text-muted-foreground animate-in fade-in">
          Detected: <span className="text-foreground font-medium capitalize">{platform}</span>
        </p>
      )}
    </form>
  );
}
