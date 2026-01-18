import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DonateModal = ({ open, onOpenChange }: DonateModalProps) => {
  const [copied, setCopied] = useState(false);
  const merchantNumber = "01805603555";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(merchantNumber);
    setCopied(true);
    toast.success("Number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Support This Project ☕
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="rounded-xl overflow-hidden border-4 border-[#E2136E]/20 shadow-lg">
            <img 
              src="/images/bkash-qr.png" 
              alt="bKash QR Code" 
              className="w-56 h-56 object-contain bg-white"
            />
          </div>
          
          {/* Scan instruction */}
          <p className="text-sm text-muted-foreground">
            Scan to donate via <span className="text-[#E2136E] font-semibold">bKash</span>
          </p>
          
          {/* Merchant number with copy */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">Merchant:</span>
            <span className="font-mono font-semibold">{merchantNumber}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[#E2136E]/10"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
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
