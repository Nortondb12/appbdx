export type Platform = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'unknown';

export interface VideoMedia {
  url?: string;
  videoId?: string;
  quality?: string;
  format?: string;
  size?: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration?: string;
  platform: Platform;
  media: VideoMedia[];
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  platform: Platform;
  downloadedAt: string;
  url: string;
}

export interface FetchVideoResponse {
  status: boolean;
  title?: string;
  thumbnail?: string;
  duration?: string;
  media?: VideoMedia[];
  error?: string;
}
