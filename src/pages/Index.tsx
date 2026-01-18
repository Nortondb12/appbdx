import { useState, lazy, Suspense } from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VideoUrlInput } from '@/components/VideoUrlInput';
import { SupportedPlatforms } from '@/components/SupportedPlatforms';
import { useDownloadHistory } from '@/hooks/useDownloadHistory';
import { detectPlatform, isValidVideoUrl } from '@/utils/platformDetector';
import { VideoInfo, VideoMedia, FetchVideoResponse } from '@/types/video';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Lazy load components that are not immediately visible
const VideoPreview = lazy(() => import('@/components/VideoPreview').then(m => ({ default: m.VideoPreview })));
const DownloadHistory = lazy(() => import('@/components/DownloadHistory').then(m => ({ default: m.DownloadHistory })));

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [lastAttemptedUrl, setLastAttemptedUrl] = useState('');

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

      // For YouTube (no direct URL), use Cobalt API via edge function
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

      // Add to history
      addToHistory({
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        platform: videoInfo.platform,
        url: originalUrl,
      });

      // Open download in new tab
      window.open(downloadUrl, '_blank');
      
      toast.success('Download started!', {
        description: 'Your video is being downloaded.',
      });

      // Reset state after successful download
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 animate-float">
            <Download className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            All Video Downloader
          </h1>
          <p className="text-muted-foreground">
            Download videos from your favorite platforms
          </p>
        </div>

        {/* Supported platforms */}
        <SupportedPlatforms />

        {/* Main Card */}
        <Card className="glass-card mt-6">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-medium text-center text-muted-foreground">
              Paste your video link below
            </h2>
          </CardHeader>
          <CardContent>
            <VideoUrlInput
              onSubmit={handleFetchVideo}
              isLoading={isLoading}
              error={error}
              showRetry={isServiceUnavailable && !!lastAttemptedUrl}
              onRetry={() => lastAttemptedUrl && handleFetchVideo(lastAttemptedUrl)}
            />
          </CardContent>
        </Card>

        {/* Video Preview */}
        {videoInfo && (
          <Suspense fallback={<div className="mt-6 h-64 bg-muted/50 rounded-lg animate-pulse" />}>
            <div className="mt-6">
              <VideoPreview
                video={videoInfo}
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
            </div>
          </Suspense>
        )}

        {/* Download History */}
        <Suspense fallback={null}>
          <DownloadHistory history={history} onClear={clearHistory} />
        </Suspense>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            For educational purposes only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
