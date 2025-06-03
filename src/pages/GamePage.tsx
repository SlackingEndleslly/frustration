
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { Heart, Zap, Flame, RotateCcw, Home } from "lucide-react";
import { toast } from "sonner";

const ATTACK_OPTIONS = [
  { 
    id: "punch", 
    label: "Punch", 
    icon: <Zap className="h-5 w-5" />, 
    damage: 10, 
    sound: "https://www.myinstants.com/media/sounds/punch-sound-effect.mp3" 
  },
  { 
    id: "kick", 
    label: "Kick", 
    icon: <Flame className="h-5 w-5" />, 
    damage: 15, 
    sound: "https://www.myinstants.com/media/sounds/thud-sound-effect_1.mp3" 
  },
];

const DEFEAT_SOUND = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";
const VICTORY_MESSAGE = "Buddy defeated! Your rage has been vented!";

const GamePage = () => {
  const navigate = useNavigate();
  const { buddyImage, health, maxHealth, damage, resetGame, isGameOver, voiceRecording } = useGame();
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [showPunchEffect, setShowPunchEffect] = useState(false);
  const [showKickEffect, setShowKickEffect] = useState(false);
  const [showVictoryMessage, setShowVictoryMessage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Redirect to home if there's no buddy image after a short delay
  useEffect(() => {
    // Give context time to load buddy image if it exists
    const timer = setTimeout(() => {
      if (!buddyImage) {
        toast.error("Please select a buddy first!");
        navigate("/");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [buddyImage, navigate]);
  
  // Handle game over state
  useEffect(() => {
    if (isGameOver) {
      try {
        // Play defeat sound
        if (audioRef.current) {
          audioRef.current.src = DEFEAT_SOUND;
          audioRef.current.play().catch(err => console.error("Error playing defeat sound:", err));
        }
        
        // Show victory message with delay
        setTimeout(() => {
          setShowVictoryMessage(true);
          toast.success(VICTORY_MESSAGE);
        }, 500);
      } catch (error) {
        console.error("Error in game over effect:", error);
      }
    }
  }, [isGameOver]);
  
  const handleAttack = (e: React.MouseEvent, attackId: string, damageAmount: number, soundUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAnimating || isGameOver) return;
    
    setActiveAttack(attackId);
    setIsAnimating(true);
    
    try {
      // Play sound immediately - create new audio instance for instant playback
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.7;
      
      // Set source and play immediately
      audio.src = soundUrl;
      audio.play().catch(() => {
        // Fallback to Web Audio API for instant response
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Different frequencies for punch vs kick
          if (attackId === "kick") {
            // Lower, thumpier sound for kick
            oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
          } else {
            // Higher, snappier sound for punch
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          }
        } catch (fallbackError) {
          console.log("Audio fallback also failed:", fallbackError);
        }
      });
      
      // Show appropriate effect based on attack type
      if (attackId === "punch") {
        setShowPunchEffect(true);
        setShowKickEffect(false);
      } else if (attackId === "kick") {
        setShowKickEffect(true);
        setShowPunchEffect(false);
      }
      
      // Apply damage after a short delay
      setTimeout(() => {
        damage(damageAmount);
        
        // Reset animation states after a delay
        setTimeout(() => {
          setIsAnimating(false);
          setActiveAttack(null);
          setShowPunchEffect(false);
          setShowKickEffect(false);
        }, 500);
      }, 300);
    } catch (error) {
      console.error("Error during attack:", error);
      setIsAnimating(false);
      setActiveAttack(null);
      setShowPunchEffect(false);
      setShowKickEffect(false);
    }
  };
  
  const getHealthColor = () => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    return "bg-rage-danger";
  };
  
  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    e.stopPropagation(); // Stop event propagation to prevent navigation issues
    navigate("/");
  };
  
  const handlePlayAgain = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset the game state completely
    resetGame();
    setShowVictoryMessage(false);
    setIsAnimating(false);
    setActiveAttack(null);
    setShowPunchEffect(false);
    setShowKickEffect(false);
    
    toast.info("Buddy reset! Keep venting your rage!");
  };
  
  return (
    <Layout title="BEAT THE BUDDY">
      <div className="rage-card max-w-md w-full mx-auto">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rage-danger" />
          <h3 className="text-lg font-medium">Buddy Health</h3>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{health} / {maxHealth}</span>
            <span className={`text-sm ${health <= 30 ? "text-rage-danger font-bold" : "text-muted-foreground"}`}>
              {health <= 0 ? "DEFEATED!" : health <= 30 ? "ALMOST DEFEATED!" : ""}
            </span>
          </div>
          <Progress 
            value={(health / maxHealth) * 100} 
            className="h-3"
            indicatorClassName={getHealthColor()} 
          />
        </div>
        
        <div className="mb-8 relative">
          <div className="buddy-container w-3/4 mx-auto overflow-hidden relative">
            {buddyImage && (
              <img 
                src={buddyImage.src} 
                alt={buddyImage.alt || "Buddy"} 
                className={`object-cover w-full h-full ${isAnimating ? "animate-shake" : ""} ${isGameOver ? "opacity-50" : ""}`}
                onError={(e) => {
                  console.error("Error loading buddy image");
                  e.currentTarget.src = "https://placehold.co/300x300/FF6B6B/ffffff?text=Buddy";
                }}
              />
            )}
            
            {/* Punch effect overlay */}
            {showPunchEffect && (
              <div className="punch-effect-container">
                <img 
                  src="/lovable-uploads/c6450c89-e7ac-431f-b053-731d8f0f1e84.png" 
                  alt="Punch Effect" 
                  className="punch-effect"
                />
              </div>
            )}
            
            {/* Kick effect overlay */}
            {showKickEffect && (
              <div className="kick-effect-container">
                <img 
                  src="/lovable-uploads/7a3289de-ebb0-4cd8-a948-00edc6e3c549.png" 
                  alt="Kick Effect" 
                  className="kick-effect"
                />
              </div>
            )}
            
            {isGameOver && showVictoryMessage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="bg-card p-3 rounded-lg">
                  <span className="text-2xl font-bold text-rage-danger">DEFEATED!</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Attack Options</h3>
          <div className="grid grid-cols-2 gap-4">
            {ATTACK_OPTIONS.map((attack) => (
              <Button
                key={attack.id}
                onClick={(e) => handleAttack(e, attack.id, attack.damage, attack.sound)}
                className={`
                  p-3 h-auto flex flex-col items-center gap-1 transition-all duration-300
                  ${activeAttack === attack.id ? "bg-rage-accent scale-95" : "bg-rage hover:bg-rage-accent"}
                `}
                disabled={isGameOver || isAnimating}
              >
                {attack.icon}
                <span className="text-sm font-medium">{attack.label}</span>
                <span className="text-xs text-white/70">-{attack.damage}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {isGameOver ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              onClick={handlePlayAgain}
              className="rage-button flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Rehit Buddy</span>
            </Button>
            
            <Button 
              onClick={handleGoHome}
              className="rage-button flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </div>
        ) : (
          <div className="flex justify-between mt-6">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/");
              }}
              variant="outline"
              className="px-4"
            >
              Back to Home
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/record-voice");
              }}
              variant="outline"
              className="px-4"
            >
              Change Voice
            </Button>
          </div>
        )}
      </div>

      <audio ref={audioRef} preload="auto" />
    </Layout>
  );
};

export default GamePage;
