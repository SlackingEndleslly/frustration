
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Mic, Play, Pause, Volume2, AlertCircle } from "lucide-react";

const RecordVoicePage = () => {
  const navigate = useNavigate();
  const { buddyImage, setVoiceRecording } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [hasTestedMicrophone, setHasTestedMicrophone] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxRecordingTime = 30; // 30 seconds only

  // Check microphone permission status on component mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermissionStatus(permission.state);
          
          // Listen for permission changes
          permission.onchange = () => {
            setMicPermissionStatus(permission.state);
          };
        } else {
          // If permissions API is not available, assume we need to test
          setMicPermissionStatus('unknown');
        }
      } catch (error) {
        console.log("Permission API not supported, will check on recording attempt");
        setMicPermissionStatus('unknown');
      }
    };
    
    checkMicPermission();
  }, []);

  useEffect(() => {
    // Create new Audio for playback
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      audioRef.current = audio;
    }

    // Clean up audio if component is unmounted or URL changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Cleanup on unmount so record/play logic is correct
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error("Error stopping media recorder:", error);
        }
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const requestMicrophoneAccess = async () => {
    setIsCheckingPermission(true);
    
    try {
      // First, try to get user media to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // If successful, stop the stream immediately (we just wanted to check permission)
      stream.getTracks().forEach(track => track.stop());
      
      setMicPermissionStatus('granted');
      setHasTestedMicrophone(true);
      toast.success("Microphone access granted! You can now start recording.");
      return true;
    } catch (error: any) {
      console.error("Error requesting microphone access:", error);
      
      if (error.name === 'NotAllowedError') {
        setMicPermissionStatus('denied');
        toast.error("Microphone access denied. Please allow microphone access in your browser settings and refresh the page.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else if (error.name === 'NotSupportedError') {
        toast.error("Microphone recording is not supported in this browser.");
      } else {
        toast.error("Could not access microphone. Please check your browser settings.");
      }
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  };

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
        const tracks = mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
      };

      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      mediaRecorder.start();

      // Only allow recording for exactly 30 seconds, can't stop early
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            // Stop only here!
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              try {
                mediaRecorderRef.current.stop();
              } catch (error) {
                console.error("Error stopping media recorder:", error);
              }
            }
            setIsRecording(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            toast.success("Recording stopped after 30s!");
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);

      toast.success("Recording started!");
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      
      if (error.name === 'NotAllowedError') {
        setMicPermissionStatus('denied');
        toast.error("Microphone access denied. Please click 'Allow Microphone' and grant permission.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else {
        toast.error("Could not access microphone. Please check permissions and try again.");
      }
    }
  };

  const handlePlayPause = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying && !isPaused) {
        // PAUSE
        audioRef.current.pause();
        setIsPaused(true);
      } else if (isPaused) {
        // RESUME
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          toast.error("Could not play audio. Please try again.");
        });
        setIsPaused(false);
      } else {
        // PLAY
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

  // Update playing/paused state if user interacts with the Audio element
  useEffect(() => {
    if (audioRef.current) {
      const onEnded = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      const onPlay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      const onPause = () => {
        if (audioRef.current) {
          // only set isPaused if pause before end
          if (audioRef.current.currentTime !== audioRef.current.duration) {
            setIsPaused(true);
            setIsPlaying(true);
          }
        }
      };

      audioRef.current.onended = onEnded;
      audioRef.current.onplay = onPlay;
      audioRef.current.onpause = onPause;
    }
  }, [audioUrl]);

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    
    if (audioUrl) {
      setVoiceRecording(audioUrl);
      toast.success("Voice recorded successfully! Taking you to the game...");
      
      // Give the toast time to show before navigating
      setTimeout(() => {
        navigate("/play-game");
      }, 800);
    } else {
      toast.error("Please record your rage sound first!");
    }
  };

  // More explicit logic for when to show recording button
  const canStartRecording = () => {
    // In APK/mobile environments, sometimes permission status is unknown but microphone works
    if (micPermissionStatus === 'granted') return !isRecording && !audioUrl;
    if (micPermissionStatus === 'unknown' && hasTestedMicrophone) return !isRecording && !audioUrl;
    return false;
  };

  const needsPermission = () => {
    if (micPermissionStatus === 'denied') return true;
    if (micPermissionStatus === 'unknown' && !hasTestedMicrophone) return true;
    return false;
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

          {/* Microphone Permission Status */}
          {micPermissionStatus === 'denied' && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Microphone access denied. Please allow microphone access in your browser and refresh the page.
              </span>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            {needsPermission() && !isCheckingPermission && (
              <Button 
                onClick={requestMicrophoneAccess}
                className="rage-button w-full flex items-center justify-center gap-2"
              >
                <Mic className="h-5 w-5" />
                <span>Allow Microphone</span>
              </Button>
            )}

            {isCheckingPermission && (
              <Button 
                disabled={true}
                className="w-full flex items-center justify-center gap-2 opacity-50"
              >
                <Mic className="h-5 w-5" />
                <span>Checking permissions...</span>
              </Button>
            )}

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

                {/* No stop recording button anymore */}
                <Button 
                  disabled={true}
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2 opacity-40 pointer-events-none"
                >
                  <Mic className="h-4 w-4" />
                  <span>Recording... (Wait 30s)</span>
                </Button>
              </div>
            ) : canStartRecording() ? (
              <Button 
                onClick={startRecording}
                className="rage-button w-full flex items-center justify-center gap-2"
              >
                <Mic className="h-5 w-5" />
                <span>Start Recording</span>
              </Button>
            ) : null}

            {audioUrl && (
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
                  setIsPaused(false);
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
            Continue to Game
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
