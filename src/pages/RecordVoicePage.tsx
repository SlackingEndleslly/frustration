import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Mic, Play, Pause, Volume2 } from "lucide-react";
import { Capacitor } from '@capacitor/core';

const RecordVoicePage = () => {
  const navigate = useNavigate();
  const { buddyImage, setVoiceRecording } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxRecordingTime = 30;

  // Check and request permissions
  const requestMicrophonePermission = async () => {
    try {
      console.log("Requesting microphone permission...");
      
      // For Capacitor apps (mobile)
      if (Capacitor.isNativePlatform()) {
        console.log("Native platform detected, requesting permissions");
        // For native platforms, we'll rely on the getUserMedia call to trigger permission
        // The native app will handle the permission dialog
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      console.log("Microphone permission granted");
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setPermissionGranted(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow microphone permissions in your device settings.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found on this device.");
      } else if (error.name === 'NotSupportedError') {
        toast.error("Microphone not supported on this device.");
      } else {
        toast.error("Could not access microphone. Please check your device settings and permissions.");
      }
      return false;
    }
  };

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!permissionChecked) {
        setPermissionChecked(true);
        
        try {
          // Check if getUserMedia is available
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia not supported");
            setPermissionGranted(false);
            return;
          }

          // For web browsers, check existing permissions
          if (!Capacitor.isNativePlatform()) {
            try {
              const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
              if (permissionStatus.state === 'granted') {
                setPermissionGranted(true);
                return;
              }
            } catch (e) {
              console.log("Permission query not supported, will request on record");
            }
          }
          
          // Don't auto-request on mount, wait for user interaction
          setPermissionGranted(false);
        } catch (error) {
          console.error("Error checking permissions:", error);
          setPermissionGranted(false);
        }
      }
    };

    checkPermissions();
  }, [permissionChecked]);

  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error("Error stopping media recorder:", error);
        }
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying && !isPaused) {
        audioRef.current.pause();
        setIsPaused(true);
      } else if (isPaused) {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          toast.error("Could not play audio. Please try again.");
        });
        setIsPaused(false);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          toast.error("Could not play audio. Please try again.");
        });
        setIsPlaying(true);
        setIsPaused(false);
      }
    }
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (audioUrl) {
      setVoiceRecording(audioUrl);
      toast.success("Voice recorded successfully! Taking you to the game...");
      
      setTimeout(() => {
        navigate("/play-game");
      }, 800);
    } else {
      toast.error("Please record your rage sound first!");
    }
  };

  return (
    <Layout title="RECORD YOUR RAGE">
      <div className="rage-card max-w-md w-full mx-auto animate-float">
        {buddyImage && (
          <div className="mb-6 buddy-container w-1/2 mx-auto animate-float">
            <img 
              src={buddyImage.src} 
              alt={buddyImage.alt} 
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-4 text-center animate-float">Record Your Battle Cry</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center animate-float">
            Record your frustration for 30 seconds. This will be your battle cry when attacking!
          </p>

          <div className="flex flex-col items-center gap-4">
            {!audioUrl && !isRecording && (
              <Button 
                onClick={startRecording}
                className="rage-button w-full flex items-center justify-center gap-2 animate-float"
                disabled={false}
              >
                <Mic className="h-5 w-5" />
                <span>Record Your Frustration</span>
              </Button>
            )}

            {!permissionGranted && !isRecording && !audioUrl && permissionChecked && (
              <div className="text-center animate-float">
                <p className="text-sm text-red-400 mb-2">Microphone access required</p>
                <Button 
                  onClick={startRecording}
                  variant="outline"
                  className="w-full"
                >
                  Allow Microphone Access
                </Button>
              </div>
            )}

            {isRecording && (
              <div className="w-full space-y-4 animate-float">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Recording...</span>
                  <span className="text-sm font-medium">{recordingTime}s / {maxRecordingTime}s</span>
                </div>
                <Progress 
                  value={(recordingTime / maxRecordingTime) * 100} 
                  className="h-2" 
                />

                <Button 
                  disabled={true}
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2 opacity-40 pointer-events-none"
                >
                  <Mic className="h-4 w-4" />
                  <span>Recording... (Wait {maxRecordingTime - recordingTime}s)</span>
                </Button>
              </div>
            )}

            {audioUrl && (
              <div className="w-full space-y-4 animate-float">
                <div className="w-full flex flex-row gap-2">
                  <Button 
                    onClick={handlePlayPause}
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isPlaying && !isPaused ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Play Recording</span>
                      </>
                    )}
                    <Volume2 className="h-4 w-4 ml-1 text-rage" />
                  </Button>
                </div>

                <Button 
                  onClick={() => {
                    setAudioUrl(null);
                    setRecordingTime(0);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current = null;
                    }
                    setIsPlaying(false);
                    setIsPaused(false);
                    setPermissionDenied(false);
                  }}
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-white"
                >
                  Record Again
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between animate-float">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              navigate("/select-buddy");
            }}
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
            Attack Buddy
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
