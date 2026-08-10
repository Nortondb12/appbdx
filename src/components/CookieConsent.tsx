import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CookieConsentProps {
  onAccept: () => void;
}

export const CookieConsent = ({ onAccept }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('ad-consent-granted');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ad-consent-granted', 'true');
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="glass-card p-6 border-primary/20 shadow-2xl rounded-2xl bg-background/80 backdrop-blur-xl flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Privacy & Ads</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              We use cookies and show advertisements to keep this service free. By continuing, you agree to our use of cookies and data for personalized ads.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8 -mt-1 -mr-1"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl h-10 text-xs"
            onClick={() => setIsVisible(false)}
          >
            Manage Settings
          </Button>
          <Button 
            className="flex-1 rounded-xl h-10 text-xs font-bold"
            onClick={handleAccept}
          >
            Accept & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
