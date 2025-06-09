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
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxRecordingTime = 30;

  // Enhanced permission request for mobile devices
  const requestMicrophonePermission = async () => {
    console.log("Requesting microphone permission...");
    setIsRequestingPermission(true);
    
    try {
      // For Capacitor/mobile apps, show native permission dialog
      if (Capacitor.isNativePlatform()) {
        console.log("Running on native platform, requesting native permissions");
        
        // Force permission request through getUserMedia which triggers native dialog
        try {
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
          toast.success("Microphone permission granted!");
          return true;
        } catch (error: any) {
          console.error("Native permission request failed:", error);
          
          if (error.name === 'NotAllowedError') {
            toast.error("Microphone access denied. Please go to your device settings and enable microphone access for this app.");
          } else if (error.name === 'NotFoundError') {
            toast.error("No microphone found on this device.");
          } else {
            toast.error("Could not access microphone. Please check your device settings and allow microphone permissions.");
          }
          setPermissionGranted(false);
          return false;
        }
      } else {
        // Web browser permission request
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100
            } 
          });
          
          stream.getTracks().forEach(track => track.stop());
          setPermissionGranted(true);
          toast.success("Microphone permission granted!");
          return true;
        } catch (error: any) {
          console.error("Web permission request failed:", error);
          
          if (error.name === 'NotAllowedError') {
            toast.error("Microphone access denied. Please allow microphone permissions in your browser.");
          } else if (error.name === 'NotFoundError') {
            toast.error("No microphone found on this device.");
          } else {
            toast.error("Could not access microphone. Please check your browser settings.");
          }
          setPermissionGranted(false);
          return false;
        }
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    console.log("Starting recording...");
    
    // Always request permission when starting recording
    const granted = await requestMicrophonePermission();
    if (!granted) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        toast.success("Recording completed!");
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
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
      console.error("Error starting recording:", error);
      setIsRecording(false);
      toast.error("Failed to start recording. Please ensure microphone permissions are granted.");
    }
  };

  // Stop recording
  const stopRecording = async () => {
    console.log("Stopping recording...");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      toast.error("Error stopping recording.");
    }
  };

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!permissionChecked) {
        setPermissionChecked(true);
        
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia not supported");
            setPermissionGranted(false);
            return;
          }

          // For mobile/native platforms, don't pre-check permissions
          // This prevents issues with permission state checking
          if (Capacitor.isNativePlatform()) {
            console.log("Native platform detected, will request permission on record");
            setPermissionGranted(false);
            return;
          }

          // For web, try to check permission status
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            if (permissionStatus.state === 'granted') {
              setPermissionGranted(true);
              return;
            }
          } catch (e) {
            console.log("Permission query not supported, will request on record");
          }
          
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
            Record your frustration for 30 seconds. This will be your battle cry when attacking!
          </p>

          <div className="flex flex-col items-center gap-4">
            {!audioUrl && !isRecording && (
              <div className="w-full space-y-4">
                <Button 
                  onClick={startRecording}
                  className="rage-button w-full flex items-center justify-center gap-2"
                  disabled={isRequestingPermission}
                >
                  <Mic className="h-5 w-5" />
                  <span>{isRequestingPermission ? "Requesting Permission..." : "Record Your Frustration"}</span>
                </Button>
                
                {Capacitor.isNativePlatform() && !permissionGranted && (
                  <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-400 mb-2">
                      📱 On mobile devices, you'll be asked to allow microphone access when you tap "Record"
                    </p>
                    <p className="text-xs text-yellow-300">
                      If permission is denied, please go to your device Settings → Apps → Frustration → Permissions and enable Microphone
                    </p>
                  </div>
                )}
                
                {!Capacitor.isNativePlatform() && !permissionGranted && (
                  <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400 mb-2">
                      🎤 Microphone access required for recording
                    </p>
                    <p className="text-xs text-blue-300">
                      Click "Record" to grant microphone permissions
                    </p>
                  </div>
                )}
              </div>
            )}

            {isRecording && (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Recording...</span>
                  <span className="text-sm font-medium">{recordingTime}s / {maxRecordingTime}s</span>
                </div>
                <Progress 
                  value={(recordingTime / maxRecordingTime) * 100} 
                  className="h-2" 
                />

                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  <span>Stop Recording</span>
                </Button>
              </div>
            )}

            {audioUrl && (
              <div className="w-full space-y-4">
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
                    setPermissionGranted(false);
                    setPermissionChecked(false);
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
            Attack Buddy
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RecordVoicePage;
