import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface AdOverlayProps {
  open: boolean;
  onClose: () => void;
  onAdComplete: () => void;
}

export const AdOverlay = ({ open, onClose, onAdComplete }: AdOverlayProps) => {
  const [countdown, setCountdown] = useState(5);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [open, countdown]);

  useEffect(() => {
    if (open) {
      // Initialize AdSense push
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        setIsAdLoaded(true);
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [open]);

  const handleContinue = () => {
    onAdComplete();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && countdown === 0 && onClose()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Preparing Your Download
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Ad Slot Placeholder */}
          <div className="w-full min-h-[250px] bg-secondary/30 rounded-xl flex items-center justify-center border border-dashed border-primary/20 relative overflow-hidden">
            {!isAdLoaded && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading advertisement...</p>
              </div>
            )}
            
            {/* Actual AdSense Slot (Demo) */}
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '100%', height: '250px' }}
                 data-ad-client="ca-pub-3940256099942544"
                 data-ad-slot="8889151529"></ins>
          </div>

          <div className="w-full space-y-4">
            <p className="text-center text-sm text-muted-foreground px-4">
              Your download will be ready in a moment. Supporting us with ads helps keep this service free!
            </p>
            
            <Button
              onClick={handleContinue}
              disabled={countdown > 0}
              className="w-full rounded-2xl h-12 font-bold transition-all duration-300"
            >
              {countdown > 0 ? (
                `Wait ${countdown}s...`
              ) : (
                <span className="flex items-center gap-2">
                  Continue to Download
                  <ExternalLink className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
