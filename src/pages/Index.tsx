import { useState, lazy, Suspense } from 'react';
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

  const { history, addToHistory, clearHistory } = useDownloadHistory();

  const handleFetchVideo = async (url: string) => {
    setError(undefined);
    setIsServiceUnavailable(false);
    setVideoInfo(null);
    setOriginalUrl(url);
    setLastAttemptedUrl(url);

    if (!isValidVideoUrl(url)) {
      setError('Please enter a valid video URL from Facebook, Instagram, YouTube, or TikTok');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-video', {
        body: { url },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch video');
      }

      const response = data as FetchVideoResponse & { isServiceUnavailable?: boolean };

      if (!response.status) {
        setError(response.error || 'Failed to fetch video information');
        setIsServiceUnavailable(response.isServiceUnavailable || false);
        return;
      }

      const platform = detectPlatform(url);
      
      setVideoInfo({
        title: response.title || 'Untitled Video',
        thumbnail: response.thumbnail || '/placeholder.svg',
        duration: response.duration,
        platform,
        media: response.media || [],
        originalUrl: response.originalUrl,
      });

    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-12 md:py-20">
        {/* Modern Header Section */}
        <div className="text-center mb-12 animate-fade-up relative">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10" />
          
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="flex gap-4">
              {/* Option 1: Modern Abstract */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform cursor-pointer group">
                <Download className="w-8 h-8 text-white group-hover:animate-bounce" />
              </div>
              {/* Option 2: Minimalist Ring */}
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center hover:border-primary transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="w-6 h-6 text-primary" />
                </div>
              </div>
              {/* Option 3: Glassmorphism */}
              <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl hover:bg-white/10 transition-colors cursor-pointer">
                <div className="relative">
                  <Download className="w-8 h-8 text-primary/80" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase mb-1">DESIGN OPTIONS</span>
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 px-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-x drop-shadow-sm">
              All Video Downloader
            </span>
          </h1>
          <p className="text-muted-foreground/80 max-w-lg mx-auto text-lg font-medium leading-relaxed">
            A sua ferramenta definitiva para baixar vídeos com <span className="text-primary font-bold">qualidade máxima</span> de qualquer rede social.
          </p>
        </div>

        {/* Platform tabs */}
        <div className="mb-8 animate-fade-up-delay-1">
          <PlatformTabs 
            selectedPlatform={selectedPlatform} 
            onSelectPlatform={setSelectedPlatform} 
          />
        </div>

        {/* Main card */}
        <div className="w-full max-w-xl mb-10 animate-fade-up-delay-2">
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <VideoUrlInput
              onSubmit={handleFetchVideo}
              isLoading={isLoading}
              error={error}
              showRetry={isServiceUnavailable && !!lastAttemptedUrl}
              onRetry={() => lastAttemptedUrl && handleFetchVideo(lastAttemptedUrl)}
              placeholder={platformPlaceholders[selectedPlatform]}
            />
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
                onDownload={handleDownload}
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
      </main>
    </div>
  );
};

export default Index;
