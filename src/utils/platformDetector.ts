import { Platform } from '@/types/video';

export function detectPlatform(url: string): Platform {
  if (!url) return 'unknown';
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname.includes('fb.com')) {
      return 'facebook';
    }
    
    if (hostname.includes('instagram.com') || hostname.includes('instagr.am')) {
      return 'instagram';
    }
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be') || hostname.includes('yt.be')) {
      return 'youtube';
    }
    
    if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    }
  } catch (e) {
    // Fallback for partial URLs
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) return 'facebook';
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('tiktok.com')) return 'tiktok';
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
