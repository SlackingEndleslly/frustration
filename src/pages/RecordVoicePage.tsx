
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
      console.log("Starting recording on device...");
      
      // Mobile-friendly audio constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Got media stream successfully");
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Try different MIME types for better mobile compatibility
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = ''; // Use default
        }
      }
      
      console.log("Using MIME type:", mimeType);
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data chunk received, size:", event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, total chunks:", chunksRef.current.length);
        
        if (chunksRef.current.length > 0) {
          const finalMimeType = mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: finalMimeType });
          console.log("Created blob with size:", blob.size, "type:", finalMimeType);
          
          const url = URL.createObjectURL(blob);
          console.log("Created audio URL");
          
          setVoiceRecording(url);
          setHasRecording(true);
          toast.success("Voice recorded successfully!");
        } else {
          console.error("No audio data recorded");
          toast.error("No audio data was recorded");
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log("Stopped track:", track.kind);
          });
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording failed");
        setIsRecording(false);
      };

      // Start recording with smaller time slices for mobile
      mediaRecorder.start(1000); // 1 second time slices
      setIsRecording(true);
      console.log("Recording started successfully");
      toast.success("Recording started!");
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      
      if (error.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow microphone permissions.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found on this device.");
      } else if (error.name === 'NotSupportedError') {
        toast.error("Audio recording not supported on this device.");
      } else {
        toast.error("Could not start recording. Please try again.");
      }
      
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Stop command sent");
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
            Tap to record your voice!
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
            <div className="text-green-600 font-medium text-lg">
              ✓ Voice Recorded!
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
