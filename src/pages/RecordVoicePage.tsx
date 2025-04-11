
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Mic, Square, Play, Volume2 } from "lucide-react";

const RecordVoicePage = () => {
  const navigate = useNavigate();
  const { buddyImage, setVoiceRecording } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const maxRecordingTime = 30; // Extended to 30 seconds
  
  useEffect(() => {
    // Create audio element for controlled playback
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

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
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      setIsRecording(true);
      setRecordingTime(0);
      mediaRecorder.start();
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
      
      toast.success("Recording started!");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
      
      toast.success("Recording stopped!");
    }
  };
  
  const playRecording = () => {
    if (audioUrl && audioRef.current && !isPlaying) {
      // Stop any currently playing audio first
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Play the audio and update state
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleContinue = () => {
    if (audioUrl) {
      setVoiceRecording(audioUrl);
      navigate("/play-game");
    } else {
      toast.error("Please record your rage sound first!");
    }
  };
  
  return (
    <Layout title="RECORD YOUR RAGE">
      <div className="rage-card max-w-md w-full mx-auto">
        {buddyImage && (
          <div className="mb-6 buddy-container w-1/2 mx-auto">
            <img 
              src={buddyImage.src} 
              alt={buddyImage.alt} 
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-4 text-center">Record Your Battle Cry</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Let your buddy know how you feel! Record a rage sound that will play when you attack.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            {isRecording ? (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Recording...</span>
                  <span className="text-sm font-medium">{recordingTime}s / {maxRecordingTime}s</span>
                </div>
                <Progress 
                  value={(recordingTime / maxRecordingTime) * 100} 
                  className="h-2" 
                  indicatorClassName="bg-rage-danger" 
                />
                
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop Recording</span>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={startRecording}
                className="rage-button w-full flex items-center justify-center gap-2"
                disabled={!!audioUrl}
              >
                <Mic className="h-5 w-5" />
                <span>Start Recording</span>
              </Button>
            )}
            
            {audioUrl && (
              <div className="w-full">
                <Button 
                  onClick={playRecording}
                  disabled={isPlaying}
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{isPlaying ? "Playing..." : "Play Recording"}</span>
                  <Volume2 className="h-4 w-4 ml-1 text-rage" />
                </Button>
              </div>
            )}
            
            {audioUrl && (
              <Button 
                onClick={() => {
                  setAudioUrl(null);
                  setRecordingTime(0);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setIsPlaying(false);
                }}
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-white"
              >
                Record Again
              </Button>
            )}
          </div>
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
            className="rage-button"
            disabled={!audioUrl}
          >
            Continue to Game
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
