import { useEffect, useState } from 'react';
import { Settings2, Download, Sparkles, Move, MousePointer2, RotateCcw } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import minimalistLogo from '@/assets/logo-minimalist.svg';

type HoverStyle = 'scale' | 'rotate' | 'float' | 'none';

interface LogoConfig {
  glow: number; // 0 - 100
  size: number; // px
  hover: HoverStyle;
}

const DEFAULTS: LogoConfig = { glow: 30, size: 120, hover: 'scale' };
const STORAGE_KEY = 'avd-logo-config';

const hoverClasses: Record<HoverStyle, string> = {
  scale: 'group-hover:scale-110',
  rotate: 'group-hover:rotate-6 group-hover:scale-105',
  float: 'group-hover:-translate-y-2',
  none: '',
};

const hoverLabels: Record<HoverStyle, string> = {
  scale: 'Scale Up',
  rotate: 'Rotate',
  float: 'Float',
  none: 'Disabled',
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
        className="absolute -inset-6 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none"
        style={{ opacity: glowOpacity }}
      />

      {failed ? (
        <div
          className="relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl"
          style={{ width: config.size, height: config.size }}
          aria-label="AVD Pro logo fallback"
        >
          <Download className="w-1/2 h-1/2" />
        </div>
      ) : (
        <img
          src={minimalistLogo}
          alt="AVD Pro logo — all video downloader"
          onError={() => setFailed(true)}
          style={{ width: config.size, height: config.size }}
          className={`relative object-contain transition-all duration-500 cursor-pointer animate-float ${hoverClasses[config.hover]}`}
        />
      )}

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Open logo settings"
            className="absolute -right-2 -bottom-2 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95 bg-background/80 backdrop-blur-md border border-white/10"
          >
            <Settings2 className="h-5 w-5 text-primary" />
          </Button>
        </SheetTrigger>
        <SheetContent className="glass-card border-l border-white/10 sm:max-w-md">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-primary" />
              Logo Settings
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Customize how the brand logo appears and behaves in the header.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8 py-4">
            {/* Glow Intensity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Glow Intensity
                </Label>
                <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
                  {config.glow}%
                </span>
              </div>
              <Slider
                value={[config.glow]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => update({ glow: v })}
                className="py-4"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* Logo Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Move className="w-4 h-4 text-blue-400" />
                  Logo Size
                </Label>
                <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
                  {config.size}px
                </span>
              </div>
              <Slider
                value={[config.size]}
                min={60}
                max={280}
                step={1}
                onValueChange={([v]) => update({ size: v })}
                className="py-4"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* Hover Animation */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2 mb-4">
                <MousePointer2 className="w-4 h-4 text-purple-400" />
                Hover Animation
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(hoverLabels) as HoverStyle[]).map((h) => (
                  <Button
                    key={h}
                    variant={config.hover === h ? 'default' : 'outline'}
                    className={`h-12 transition-all duration-300 ${
                      config.hover === h ? 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => update({ hover: h })}
                  >
                    {hoverLabels[h]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="absolute bottom-6 left-6 right-6 sm:flex-col gap-3">
            <Separator className="bg-white/5 mb-4" />
            <Button 
              variant="outline" 
              className="w-full border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all flex items-center gap-2"
              onClick={() => update(DEFAULTS)}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HeaderLogo;
