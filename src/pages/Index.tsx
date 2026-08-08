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
  const [logoStyle, setLogoStyle] = useState<'modern' | 'minimalist' | 'glass'>('modern');

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

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 md:py-16">
        {/* Advanced Modern Header */}
        <div className="w-full max-w-5xl text-center mb-16 animate-fade-up relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
          
          <div className="flex flex-col items-center gap-10">
            {/* Logo Style Display & Selector */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative flex items-center gap-8 bg-white/5 dark:bg-black/20 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                {/* Visual Options Labels */}
                <div className="hidden lg:flex flex-col items-end gap-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-60">
                  <span>INTERFACE</span>
                  <span>EVOLUTION</span>
                </div>

                <div className="flex gap-6">
                  <button 
                    onClick={() => setLogoStyle('modern')}
                    className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(59,130,246,0.5)] transform transition-all duration-500 ${logoStyle === 'modern' ? 'scale-110 ring-2 ring-white/50 z-20' : 'opacity-40 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}`}
                  >
                    <Download className="w-10 h-10 text-white drop-shadow-lg" />
                    {logoStyle === 'modern' && <div className="absolute -top-2 -right-2 bg-white text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md">ACTIVE</div>}
                  </button>

                  <button 
                    onClick={() => setLogoStyle('minimalist')}
                    className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${logoStyle === 'minimalist' ? 'border-primary scale-110 ring-2 ring-primary/20 bg-primary/10 z-20' : 'border-primary/20 opacity-40 hover:opacity-100 hover:scale-105'}`}
                  >
                    <Download className={`w-8 h-8 ${logoStyle === 'minimalist' ? 'text-primary' : 'text-primary/40'}`} />
                    {logoStyle === 'minimalist' && <div className="absolute -top-2 -right-2 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md">ACTIVE</div>}
                  </button>

                  <button 
                    onClick={() => setLogoStyle('glass')}
                    className={`relative w-20 h-20 rounded-3xl backdrop-blur-3xl border flex items-center justify-center shadow-2xl transition-all duration-500 ${logoStyle === 'glass' ? 'bg-white/20 border-white/50 scale-110 ring-2 ring-white/30 z-20' : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100 hover:scale-105'}`}
                  >
                    <div className="relative">
                      <Download className={`w-10 h-10 ${logoStyle === 'glass' ? 'text-primary animate-pulse' : 'text-primary/30'}`} />
                      {logoStyle === 'glass' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white/50 animate-bounce" />}
                    </div>
                    {logoStyle === 'glass' && <div className="absolute -top-2 -right-2 bg-accent text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md">ACTIVE</div>}
                  </button>
                </div>

                <div className="hidden lg:flex flex-col items-start gap-1 text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">
                  <span>PREMIUM</span>
                  <span>AVD PRO</span>
                </div>
              </div>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-x drop-shadow-[0_5px_15px_rgba(var(--primary-rgb),0.3)]">
                  AVD Pro
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground/90 font-medium max-w-2xl mx-auto leading-relaxed text-balance">
                Download your favorite content from <span className="text-foreground font-bold border-b-2 border-primary/30 pb-0.5">any social media</span> with stunning quality.
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
          <div className="glass-card rounded-[2.5rem] p-2 md:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/5 overflow-hidden group">
            <div className="bg-background/40 backdrop-blur-md rounded-[2rem] p-6 md:p-10 transition-all duration-500 group-hover:bg-background/60">
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