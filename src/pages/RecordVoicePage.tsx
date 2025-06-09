
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
  const [VoiceRecorder, setVoiceRecorder] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxRecordingTime = 30;

  // Load voice recorder plugin dynamically
  useEffect(() => {
    const loadVoiceRecorder = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const module = await import('@capacitor-community/voice-recorder');
          setVoiceRecorder(module.VoiceRecorder);
          console.log("Voice recorder plugin loaded successfully");
        } catch (error) {
          console.log("Voice recorder plugin not available:", error);
        }
      }
    };

    loadVoiceRecorder();
  }, []);

  // Request native microphone permission
  const requestNativePermission = async () => {
    try {
      console.log("Requesting native microphone permission...");
      
      if (Capacitor.isNativePlatform() && VoiceRecorder) {
        // Request permission using Capacitor Voice Recorder
        const permissionStatus = await VoiceRecorder.requestAudioRecordingPermission();
        console.log("Native permission status:", permissionStatus);
        
        if (permissionStatus.value) {
          setPermissionGranted(true);
          toast.success("Microphone permission granted!");
          return true;
        } else {
          setPermissionGranted(false);
          toast.error("Microphone permission denied. Please enable it in your device settings.");
          return false;
        }
      } else {
        // Fallback to web API for browser
        return await requestWebPermission();
      }
    } catch (error) {
      console.error("Error requesting native permission:", error);
      // Fallback to web permission if native fails
      return await requestWebPermission();
    }
  };

  // Web permission fallback
  const requestWebPermission = async () => {
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
    } catch (error) {
      console.error("Web microphone permission denied:", error);
      setPermissionGranted(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow microphone permissions.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found on this device.");
      } else {
        toast.error("Could not access microphone. Please check your device settings.");
      }
      return false;
    }
  };

  // Start recording with native support
  const startRecording = async () => {
    console.log("Starting recording...");
    
    // Always request permission when starting recording
    const granted = await requestNativePermission();
    if (!granted) {
      return;
    }

    try {
      if (Capacitor.isNativePlatform() && VoiceRecorder) {
        // Use native recording
        console.log("Starting native recording...");
        await VoiceRecorder.startRecording();
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
      } else {
        // Fallback to web recording
        await startWebRecording();
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      toast.error("Failed to start recording. Please try again.");
    }
  };

  // Web recording fallback
  const startWebRecording = async () => {
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
  };

  // Stop recording
  const stopRecording = async () => {
    console.log("Stopping recording...");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (Capacitor.isNativePlatform() && VoiceRecorder) {
        // Stop native recording
        const result = await VoiceRecorder.stopRecording();
        console.log("Native recording result:", result);
        
        if (result.value && result.value.recordDataBase64) {
          // Convert base64 to blob URL
          const base64Data = result.value.recordDataBase64;
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: 'audio/m4a' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          toast.success("Recording completed!");
        }
        
        setIsRecording(false);
      } else {
        // Stop web recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
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
          if (Capacitor.isNativePlatform() && VoiceRecorder) {
            // Check native permission status
            const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
            console.log("Has native permission:", hasPermission);
            setPermissionGranted(hasPermission.value || false);
          } else {
            // Check web permissions
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              console.error("getUserMedia not supported");
              setPermissionGranted(false);
              return;
            }

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
          }
        } catch (error) {
          console.error("Error checking permissions:", error);
          setPermissionGranted(false);
        }
      }
    };

    checkPermissions();
  }, [permissionChecked, VoiceRecorder]);

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
              <Button 
                onClick={startRecording}
                className="rage-button w-full flex items-center justify-center gap-2"
                disabled={false}
              >
                <Mic className="h-5 w-5" />
                <span>Record Your Frustration</span>
              </Button>
            )}

            {!permissionGranted && !isRecording && !audioUrl && permissionChecked && (
              <div className="text-center">
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
