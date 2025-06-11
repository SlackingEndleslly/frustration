
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

const RecordVoicePage = () => {
  const navigate = useNavigate();
  const { buddyImage, setVoiceRecording } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Redirect if no buddy selected
  if (!buddyImage) {
    navigate("/select-buddy");
    return null;
  }

  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      
      // Simple getUserMedia call with basic audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      console.log("Got media stream:", stream);
      streamRef.current = stream;
      
      // Reset chunks
      chunksRef.current = [];
      
      // Create MediaRecorder with basic settings
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, chunks:", chunksRef.current.length);
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          console.log("Created audio URL:", url);
          
          setVoiceRecording(url);
          setHasRecording(true);
          toast.success("Recording saved!");
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleContinue = () => {
    if (!hasRecording) {
      toast.error("Please record your voice first!");
      return;
    }
    navigate("/play-game");
  };

  return (
    <Layout title="RECORD YOUR RAGE">
      <div className="rage-card max-w-md w-full mx-auto text-center">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Get Your Rage Out On:</h3>
          <div className="buddy-container w-48 h-48 mx-auto mb-4">
            <img 
              src={buddyImage.src} 
              alt={buddyImage.alt || "Your Selected Buddy"} 
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg text-muted-foreground mb-6">
            Record your voice to add to your rage!
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {!isRecording && !hasRecording && (
            <Button 
              onClick={startRecording}
              className="rage-button w-full text-lg py-6 flex items-center justify-center gap-3"
            >
              <Mic className="h-6 w-6" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button 
              onClick={stopRecording}
              className="rage-button w-full text-lg py-6 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700"
            >
              <Square className="h-6 w-6" />
              Stop Recording
            </Button>
          )}

          {hasRecording && !isRecording && (
            <div className="text-green-600 font-medium">
              ✓ Recording Complete!
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button 
            onClick={() => navigate("/select-buddy")}
            variant="outline"
            className="px-4"
          >
            Back
          </Button>
          
          <Button 
            onClick={handleContinue}
            className="rage-button px-6"
            disabled={!hasRecording}
          >
            Continue to Game
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
