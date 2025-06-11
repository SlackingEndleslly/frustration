
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const RecordVoicePage = () => {
  const navigate = useNavigate();
  const { buddyImage, setVoiceRecording } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!buddyImage) {
    navigate("/select-buddy");
    return null;
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setVoiceRecording(url);
        setHasRecording(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started!");
      
    } catch (error) {
      console.error('Recording error:', error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped!");
    }
  };

  const playRecording = () => {
    if (recordingUrl && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(recordingUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const reRecord = () => {
    // Clean up previous recording
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setRecordingUrl(null);
    setHasRecording(false);
    setIsPlaying(false);
    setVoiceRecording(null);
    toast.info("Ready to record again!");
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
          <div className="buddy-container w-48 h-48 mx-auto mb-4">
            <img 
              src={buddyImage.src} 
              alt={buddyImage.alt || "Your Selected Buddy"} 
              className="object-cover w-full h-full"
            />
          </div>
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
            <div className="space-y-3">
              <div className="text-green-600 font-medium text-lg">
                ✓ Voice Recorded!
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={isPlaying ? stopPlayback : playRecording}
                  className="flex items-center gap-2 px-4 py-2"
                  variant="outline"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? "Stop" : "Play"}
                </Button>
                
                <Button 
                  onClick={reRecord}
                  className="flex items-center gap-2 px-4 py-2"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4" />
                  Re-record
                </Button>
              </div>
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
            Continue
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
