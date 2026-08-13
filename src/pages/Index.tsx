import { useState, lazy, Suspense, useEffect } from 'react';
import { Download } from 'lucide-react';
import { VideoUrlInput } from '@/components/VideoUrlInput';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { PlatformTabs, PlatformTab } from '@/components/PlatformTabs';
import { RecentDownloadsGrid } from '@/components/RecentDownloadsGrid';
import { useDownloadHistory } from '@/hooks/useDownloadHistory';
import { detectPlatform, isValidVideoUrl } from '@/utils/platformDetector';
import { VideoInfo, VideoMedia, FetchVideoResponse } from '@/types/video';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DonateButton from '@/components/DonateButton';
import { HeaderLogo } from '@/components/HeaderLogo';
import { AdOverlay } from '@/components/AdOverlay';
import { CookieConsent } from '@/components/CookieConsent';

const VideoPreview = lazy(() => import('@/components/VideoPreview').then(m => ({ default: m.VideoPreview })));

const platformPlaceholders: Record<PlatformTab, string> = {
  all: "Paste any video link here...",
  youtube: "Paste YouTube video link...",
  instagram: "Paste Instagram video link...",
  tiktok: "Paste TikTok video link...",
  facebook: "Paste Facebook video link...",
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [lastAttemptedUrl, setLastAttemptedUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformTab>('all');
  const [adOpen, setAdOpen] = useState(false);
  const [pendingDownloadMedia, setPendingDownloadMedia] = useState<VideoMedia | null>(null);
  

  const { history, addToHistory, clearHistory } = useDownloadHistory();

  const handleFetchVideo = async (url: string) => {
    setError(undefined);
    setIsServiceUnavailable(false);
    setVideoInfo(null);
    setOriginalUrl(url);
    setLastAttemptedUrl(url);

    const trimmed = url.trim();

    // 1. Invalid URL format
    let isUrl = true;
    try {
      new URL(trimmed);
    } catch {
      isUrl = false;
    }
    if (!isUrl) {
      setError("That doesn't look like a valid link. Paste a full video URL starting with https://");
      return;
    }

    // 2. Unsupported platform
    if (detectPlatform(trimmed) === 'unknown' || !isValidVideoUrl(trimmed)) {
      setError('This platform isn\'t supported yet. We currently support YouTube, Facebook, Instagram and TikTok links.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-video', {
        body: { url: trimmed },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch video');
      }

      const response = data as FetchVideoResponse & { isServiceUnavailable?: boolean };

      if (!response.status) {
        const raw = response.error || '';
        setError(friendlyApiError(raw));
        setIsServiceUnavailable(response.isServiceUnavailable || true);
        return;
      }

      const platform = detectPlatform(trimmed);
      const media = response.media || [];

      if (media.length === 0) {
        setError('We found the post, but no downloadable video was available. It may be private, age-restricted or removed.');
        return;
      }

      setVideoInfo({
        title: response.title || 'Untitled Video',
        thumbnail: response.thumbnail || '/placeholder.svg',
        duration: response.duration,
        platform,
        media,
        originalUrl: response.originalUrl || trimmed,
      });

    } catch (err) {
      console.error('Error fetching video:', err);
      setError(friendlyApiError(err instanceof Error ? err.message : ''));
      setIsServiceUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTrigger = (media: VideoMedia) => {
    setPendingDownloadMedia(media);
    setAdOpen(true);
  };

  const handleDownload = async (media: VideoMedia) => {
    if (!videoInfo) return;

    setIsDownloading(true);

    try {
      let downloadUrl = media.url;

      if (!media.url && videoInfo.originalUrl) {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-video', {
          body: { 
            download: true,
            url: videoInfo.originalUrl,
            format: media.quality,
            platform: 'youtube',
          },
        });

        if (fnError || !data?.status) {
          throw new Error(data?.error || fnError?.message || 'Failed to get download URL');
        }

        downloadUrl = data.downloadUrl;
      }

      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      addToHistory({
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        platform: videoInfo.platform,
        url: originalUrl,
      });

      window.open(downloadUrl, '_blank');
      
      toast.success('Download started!', {
        description: 'Your video is being downloaded.',
      });

      setTimeout(() => {
        setVideoInfo(null);
        setOriginalUrl('');
      }, 1000);

    } catch (err) {
      console.error('Error downloading video:', err);
      toast.error('Download failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      {/* Fixed header buttons */}
      <div className="fixed top-4 left-4 z-50">
        <DonateButton />
      </div>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 md:py-16">
        {/* Advanced Modern Header */}
        <div className="w-full max-w-5xl text-center mb-16 animate-fade-up relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
          
          <div className="flex flex-col items-center gap-10">
            {/* Brand Logo */}
            <HeaderLogo />

            <div className="max-w-3xl space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-primary">System Online</span>
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 leading-[0.85] text-balance">
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/80 to-foreground/50 drop-shadow-2xl">
                  AppBDX
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground/80 font-medium max-w-2xl mx-auto leading-relaxed text-balance">
                Experience the <span className="text-foreground font-bold">digital frontier</span> of content downloading with high-fidelity quality.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Platform Selection */}
        <div className="w-full max-w-4xl mb-12 animate-fade-up-delay-1 flex flex-col items-center">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
          <PlatformTabs 
            selectedPlatform={selectedPlatform} 
            onSelectPlatform={setSelectedPlatform} 
          />
        </div>

        {/* Centerpiece Input Card */}
        <div className="w-full max-w-2xl mb-16 animate-fade-up-delay-2 perspective-1000">
          <div className="premium-border glass-card p-1 shadow-2xl dark:shadow-black/50 group transition-all duration-700">
            <div className="bg-background/40 backdrop-blur-3xl rounded-[2.3rem] p-6 md:p-12 transition-all duration-700 group-hover:bg-background/20">
              <VideoUrlInput
                onSubmit={handleFetchVideo}
                isLoading={isLoading || isDownloading}
                error={error}
                showRetry={isServiceUnavailable && !!lastAttemptedUrl}
                onRetry={() => lastAttemptedUrl && handleFetchVideo(lastAttemptedUrl)}
                placeholder={platformPlaceholders[selectedPlatform]}
              />
            </div>
          </div>
        </div>

        {/* Video preview */}
        {videoInfo && (
          <div className="w-full max-w-2xl mb-12">
            <Suspense fallback={
              <div className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />
            }>
              <VideoPreview
                video={videoInfo}
                onDownload={handleDownloadTrigger}
                isDownloading={isDownloading}
              />
            </Suspense>
          </div>
        )}

        {/* Recent downloads */}
        <div className="w-full max-w-4xl animate-fade-up-delay-3">
          <RecentDownloadsGrid
            history={history}
            onClear={clearHistory}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center">
          <a 
            href="https://facebook.com/Alaminbd17" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            For educational purposes only. Respect copyright laws.
          </a>
        </footer>

        <AdOverlay 
          open={adOpen} 
          onClose={() => setAdOpen(false)}
          onAdComplete={() => {
            if (pendingDownloadMedia) {
              handleDownload(pendingDownloadMedia);
            }
          }}
        />

        <CookieConsent onAccept={() => {
          console.log("Global consent granted");
        }} />
      </main>
    </div>
  );
};

export default Index;