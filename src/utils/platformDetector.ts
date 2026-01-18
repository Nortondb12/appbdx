import { Platform } from '@/types/video';

export function detectPlatform(url: string): Platform {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) {
    return 'facebook';
  }
  
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
    return 'instagram';
  }
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('yt.be')) {
    return 'youtube';
  }
  
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  
  return 'unknown';
}

export function isValidVideoUrl(url: string): boolean {
  try {
    new URL(url);
    return detectPlatform(url) !== 'unknown';
  } catch {
    return false;
  }
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    unknown: 'Unknown',
  };
  return names[platform];
}
