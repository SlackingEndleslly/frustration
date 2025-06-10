
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { Mic, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const RecordVoicePage = () => {
  const navigate = useNavigate();
  const { buddyImage, setVoiceRecording } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if no buddy selected
  if (!buddyImage) {
    toast.error("Please select a buddy first!");
    navigate("/select-buddy");
    return null;
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setVoiceRecording(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

      toast.success("Recording started! Speak for up to 30 seconds.");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success("Recording completed!");
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setVoiceRecording("");
    setRecordingTime(0);
    toast.info("Recording cleared. You can record again.");
  };

  const handleContinue = () => {
    if (!audioUrl) {
      toast.error("Please record your voice first!");
      return;
    }
    navigate("/play-game");
  };

  return (
    <Layout title="RECORD YOUR RAGE">
      <div className="rage-card max-w-md w-full mx-auto text-center">
        <div className="mb-6">
          <p className="text-lg text-muted-foreground mb-4">
            Record your voice for up to 30 seconds to add to your rage!
          </p>
          
          <div className="mb-4">
            <div className="text-2xl font-bold text-rage mb-2">
              {recordingTime}s / 30s
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-rage h-2 rounded-full transition-all duration-300"
                style={{ width: `${(recordingTime / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {!isRecording && !audioUrl && (
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

          {audioUrl && !isRecording && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={playRecording}
                  disabled={isPlaying}
                  className="flex-1 rage-button flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  {isPlaying ? "Playing..." : "Play Recording"}
                </Button>
                
                <Button 
                  onClick={resetRecording}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Record Again
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
            disabled={!audioUrl}
          >
            Continue to Game
          </Button>
        </div>

        <audio ref={audioRef} />
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
