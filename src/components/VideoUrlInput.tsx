import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { detectPlatform } from '@/utils/platformDetector';
import { sanitizeText } from '@/utils/textSanitizer';
import { cn } from '@/lib/utils';

interface VideoUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  placeholder?: string;
}

export function VideoUrlInput({ 
  onSubmit, 
  isLoading, 
  error, 
  showRetry = false, 
  onRetry,
  placeholder = "Paste video link here..."
}: VideoUrlInputProps) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      const platform = detectPlatform(trimmedUrl);
      setDetectedPlatform(platform !== 'unknown' ? platform : null);
      
      // Strict URL validation
      if (trimmedUrl.length > 3) {
        if (platform === 'unknown') {
          setLocalError('Unsupported platform. Please use a link from FB, IG, YT, or TikTok.');
        } else {
          try {
            // Check for basic URL structure
            if (trimmedUrl.includes('.') && !trimmedUrl.startsWith('.')) {
              setLocalError(null);
            } else {
              setLocalError('Please enter a valid URL format.');
            }
          } catch (e) {
            setLocalError('Invalid URL format.');
          }
        }
      } else {
        setLocalError(null);
      }
    } else {
      setDetectedPlatform(null);
      setLocalError(null);
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (detectPlatform(trimmedUrl) === 'unknown') {
      setLocalError('Please enter a valid video URL from Facebook, Instagram, YouTube, or TikTok');
      return;
    }

    setLocalError(null);
    onSubmit(trimmedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="relative">
        {/* Input container */}
        <div
          className={cn(
            "relative flex items-center rounded-2xl transition-all duration-500",
            "bg-white/5 dark:bg-black/20 backdrop-blur-md",
            "border border-white/10 dark:border-white/5",
            isFocused 
              ? "border-primary/40 ring-4 ring-primary/10 shadow-2xl shadow-primary/20 scale-[1.01]" 
              : "hover:border-white/20",
            error && "border-destructive/50"
          )}
        >
          <div className="pl-5 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(sanitizeText(e.target.value))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={cn(
              "flex-1 h-14 text-base bg-transparent border-0",
              "placeholder:text-muted-foreground/60",
              "focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            disabled={isLoading}
          />

          {/* Platform badge */}
          {detectedPlatform && (
            <div className="pr-3 animate-fade-up">
              <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
                {detectedPlatform}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {(error || localError) && (
        <div className="flex items-center gap-2 text-sm text-destructive animate-fade-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError || error}</span>
          {showRetry && onRetry && !localError && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="ml-auto text-primary hover:text-primary"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!url.trim() || isLoading || !!localError}
        className={cn(
          "w-full h-12 text-base font-medium rounded-xl",
          "gradient-btn text-primary-foreground",
          "transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/25",
          "disabled:opacity-50 disabled:shadow-none"
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Fetching video info...
          </span>
        ) : (
          "Download"
        )}
      </Button>
    </form>
  );
}
