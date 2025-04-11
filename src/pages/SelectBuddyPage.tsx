
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { useGame, BuddyImage } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const PREMADE_BUDDIES: BuddyImage[] = [
  {
    id: "buddy-1",
    src: "https://i.imgur.com/S2P0KqD.png", // Stickman
    alt: "Stickman Buddy",
  },
  {
    id: "buddy-2",
    src: "https://i.imgur.com/lKXPMvJ.png", // Ragdoll
    alt: "Ragdoll Buddy",
  },
  {
    id: "buddy-3",
    src: "https://i.imgur.com/wjobVLU.png", // Paper doll
    alt: "Paper Buddy",
  },
];

const SelectBuddyPage = () => {
  const navigate = useNavigate();
  const { setBuddyImage } = useGame();
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<BuddyImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setUploadedImage({
        id: "uploaded",
        src: imageUrl,
        alt: "Uploaded Buddy",
      });
      setSelectedBuddyId("uploaded");
    }
  };

  const handleContinue = () => {
    const selectedBuddy = selectedBuddyId === "uploaded" 
      ? uploadedImage 
      : PREMADE_BUDDIES.find(buddy => buddy.id === selectedBuddyId);
    
    if (selectedBuddy) {
      setBuddyImage(selectedBuddy);
      navigate("/record-voice");
    } else {
      toast.error("Please select or upload a buddy!");
    }
  };

  return (
    <Layout title="SELECT YOUR BUDDY">
      <div className={`rage-card w-full mx-auto ${isMobile ? 'max-w-full' : 'max-w-md'}`}>
        <div className="mb-6">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline" 
            className="w-full mb-2 p-4 md:p-6 border-dashed border-2 border-rage/50 hover:border-rage flex flex-col items-center gap-2"
          >
            <Upload className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-rage" />
            <span className="text-base md:text-lg font-medium">Upload Your Own Buddy</span>
            <span className="text-xs md:text-sm text-muted-foreground">Max size: 5MB</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          {uploadedImage && (
            <div className="mt-4 buddy-container aspect-square w-full sm:w-3/4 mx-auto max-w-[200px]">
              <img 
                src={uploadedImage.src} 
                alt={uploadedImage.alt} 
                className="object-contain w-full h-full"
              />
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 md:h-5 md:w-5 text-rage" />
            <span>Or Choose a Premade Buddy</span>
          </h3>
          
          <RadioGroup 
            value={selectedBuddyId || ""} 
            onValueChange={setSelectedBuddyId}
            className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}
          >
            {PREMADE_BUDDIES.map((buddy) => (
              <div key={buddy.id} className="space-y-2">
                <div 
                  className={`
                    buddy-container aspect-square cursor-pointer bg-muted/30 p-2
                    transition-all duration-200 max-w-full mx-auto
                    ${selectedBuddyId === buddy.id ? 'ring-4 ring-rage scale-105' : 'hover:ring-2 hover:ring-rage/70'}
                  `}
                >
                  <img 
                    src={buddy.src} 
                    alt={buddy.alt} 
                    className="object-contain w-full h-full" 
                    onClick={() => setSelectedBuddyId(buddy.id)} 
                  />
                </div>
                <RadioGroupItem 
                  value={buddy.id} 
                  id={buddy.id} 
                  className="hidden" 
                />
                <Label 
                  htmlFor={buddy.id} 
                  className="text-center block text-xs md:text-sm cursor-pointer"
                >
                  {buddy.alt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex justify-between">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="px-3 md:px-4 text-sm md:text-base"
          >
            Back
          </Button>
          <Button 
            onClick={handleContinue}
            className="rage-button text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
            disabled={!selectedBuddyId}
          >
            Continue
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SelectBuddyPage;
