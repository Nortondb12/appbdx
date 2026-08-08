import { useEffect, useState } from 'react';
import { Settings2, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import avdLogo from '@/assets/avd-logo.png';

type HoverStyle = 'scale' | 'rotate' | 'float' | 'none';

interface LogoConfig {
  glow: number; // 0 - 100
  size: number; // px
  hover: HoverStyle;
}

const DEFAULTS: LogoConfig = { glow: 60, size: 144, hover: 'scale' };
const STORAGE_KEY = 'avd-logo-config';

const hoverClasses: Record<HoverStyle, string> = {
  scale: 'group-hover:scale-110',
  rotate: 'group-hover:rotate-6 group-hover:scale-105',
  float: 'group-hover:-translate-y-2',
  none: '',
};

const hoverLabels: Record<HoverStyle, string> = {
  scale: 'Scale',
  rotate: 'Rotate',
  float: 'Float',
  none: 'None',
};

export const HeaderLogo = () => {
  const [config, setConfig] = useState<LogoConfig>(DEFAULTS);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed config */
    }
  }, []);

  const update = (patch: Partial<LogoConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const glowOpacity = config.glow / 100;

  return (
    <div className="relative group">
      <div
        className="absolute -inset-6 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-2xl transition-opacity duration-700"
        style={{ opacity: glowOpacity }}
      />

      {failed ? (
        <div
          className="relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground"
          style={{ width: config.size, height: config.size }}
          aria-label="AVD Pro logo fallback"
        >
          <Download className="w-1/2 h-1/2" />
        </div>
      ) : (
        <img
          src={avdLogo}
          alt="AVD Pro logo — all video downloader"
          onError={() => setFailed(true)}
          style={{ width: config.size, height: config.size }}
          className={`relative object-contain transition-transform duration-500 ${hoverClasses[config.hover]}`}
        />
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Configure logo style"
            className="absolute -right-2 -bottom-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-5" align="end">
          <div className="space-y-2">
            <Label>Glow: {config.glow}%</Label>
            <Slider
              value={[config.glow]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => update({ glow: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Size: {config.size}px</Label>
            <Slider
              value={[config.size]}
              min={72}
              max={200}
              step={4}
              onValueChange={([v]) => update({ size: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Hover animation</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(hoverLabels) as HoverStyle[]).map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={config.hover === h ? 'default' : 'outline'}
                  onClick={() => update({ hover: h })}
                >
                  {hoverLabels[h]}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => update(DEFAULTS)}>
            Reset
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default HeaderLogo;
