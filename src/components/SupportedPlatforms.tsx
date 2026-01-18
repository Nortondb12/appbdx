import { PlatformIcon } from '@/components/PlatformIcon';
import { getPlatformName } from '@/utils/platformDetector';
import { Platform } from '@/types/video';

const platforms: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok'];

export function SupportedPlatforms() {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {platforms.map((platform) => (
        <div
          key={platform}
          className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-default"
          title={getPlatformName(platform)}
        >
          <PlatformIcon platform={platform} size={28} />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {getPlatformName(platform)}
          </span>
        </div>
      ))}
    </div>
  );
}
