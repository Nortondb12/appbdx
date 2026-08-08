import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DonateModal = ({ open, onOpenChange }: DonateModalProps) => {
  const [copied, setCopied] = useState(false);
  const merchantNumber = "01805603555";
  // Configurable donation link (bKash payment / any donation page)
  const donationLink = "https://shop.bkash.com/alamin-dev01805603555/pay";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(merchantNumber);
    setCopied(true);
    toast.success("Number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Support This Project ☕
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-6">
          {/* QR Code */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#E2136E] to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-white p-2 transition-transform duration-500 hover:scale-105">
              <img 
                src="/images/bkash-qr.png" 
                alt="bKash QR Code" 
                className="w-56 h-56 object-contain"
              />
            </div>
          </div>
          
          {/* Scan instruction */}
          <p className="text-sm text-muted-foreground">
            Scan to donate via <span className="text-[#E2136E] font-semibold">bKash</span>
          </p>
          
          {/* Merchant number with copy */}
          <div className="flex items-center gap-3 bg-white/10 dark:bg-black/40 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 shadow-inner group">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#E2136E]">Merchant Number</span>
              <span className="font-mono font-bold text-lg">{merchantNumber}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-[#E2136E]/20 transition-all duration-300"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500 animate-in zoom-in" />
              ) : (
                <Copy className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </Button>
          </div>
          
          {/* Call to action */}
          <Button
            asChild
            className="w-full rounded-2xl bg-[#E2136E] hover:bg-[#c40f5f] text-white font-semibold gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <a href={donationLink} target="_blank" rel="noopener noreferrer">
              <Heart className="h-4 w-4" />
              Donate Now
              <ExternalLink className="h-4 w-4 opacity-70" />
            </a>
          </Button>

          {/* Thank you message */}
          <div className="text-center space-y-1 pt-2">
            <p className="text-sm text-muted-foreground">
              Thank you for your support! 🙏
            </p>
            <p className="text-sm text-muted-foreground">
              আপনার সহযোগিতার জন্য ধন্যবাদ!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonateModal;
