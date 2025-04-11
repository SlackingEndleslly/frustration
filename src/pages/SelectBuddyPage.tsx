
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { useGame, BuddyImage } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

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
      <div className="rage-card max-w-md w-full mx-auto">
        <div className="mb-6">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline" 
            className="w-full mb-2 p-6 border-dashed border-2 border-rage/50 hover:border-rage flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 mb-2 text-rage" />
            <span className="text-lg font-medium">Upload Your Own Buddy</span>
            <span className="text-sm text-muted-foreground">Max size: 5MB</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          {uploadedImage && (
            <div className="mt-4 buddy-container aspect-square w-3/4 mx-auto">
              <img 
                src={uploadedImage.src} 
                alt={uploadedImage.alt} 
                className="object-cover w-full h-full"
              />
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-rage" />
            <span>Or Choose a Premade Buddy</span>
          </h3>
          
          <RadioGroup value={selectedBuddyId || ""} onValueChange={setSelectedBuddyId} className="grid grid-cols-3 gap-4">
            {PREMADE_BUDDIES.map((buddy) => (
              <div key={buddy.id} className="space-y-2">
                <div className={`buddy-container aspect-square cursor-pointer ${selectedBuddyId === buddy.id ? 'ring-4 ring-rage' : ''}`}>
                  <img 
                    src={buddy.src} 
                    alt={buddy.alt} 
                    className="object-cover w-full h-full"
                    onClick={() => setSelectedBuddyId(buddy.id)} 
                  />
                </div>
                <RadioGroupItem 
                  value={buddy.id} 
                  id={buddy.id} 
                  className="hidden" 
                />
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex justify-between">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="px-4"
          >
            Back
          </Button>
          <Button 
            onClick={handleContinue}
            className="rage-button"
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
