import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import DonateModal from "./DonateModal";

const DonateButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Support this project"
        className="glass-card border-[#E2136E]/30 hover:border-[#E2136E]/50 hover:bg-[#E2136E]/10 transition-all duration-300 gap-2 hover:scale-105 active:scale-95 shadow-lg"
      >
        <Heart className="h-4 w-4 text-[#E2136E] animate-pulse" />
        <span className="hidden sm:inline">Support</span>
      </Button>
      
      <DonateModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default DonateButton;
