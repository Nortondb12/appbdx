import { Facebook, Instagram, Youtube } from 'lucide-react';
import { Platform } from '@/types/video';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
  size?: number;
}

// Custom TikTok icon since lucide doesn't have one
const TikTokIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export function PlatformIcon({ platform, className = '', size = 24 }: PlatformIconProps) {
  const baseClass = `transition-all duration-300 ${className}`;

  switch (platform) {
    case 'facebook':
      return <Facebook size={size} className={`${baseClass} text-blue-500`} />;
    case 'instagram':
      return <Instagram size={size} className={`${baseClass} text-pink-500`} />;
    case 'youtube':
      return <Youtube size={size} className={`${baseClass} text-red-500`} />;
    case 'tiktok':
      return <TikTokIcon size={size} className={`${baseClass} text-cyan-400`} />;
    default:
      return null;
  }
}
