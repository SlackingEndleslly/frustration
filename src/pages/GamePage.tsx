import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";
import { Heart, Zap, Hammer, Flame, RotateCcw } from "lucide-react";

const ATTACK_OPTIONS = [
  { id: "punch", label: "Punch", icon: <Zap className="h-5 w-5" />, damage: 10, sound: "https://assets.mixkit.co/active_storage/sfx/214/214-preview.mp3" },
  { id: "kick", label: "Kick", icon: <Flame className="h-5 w-5" />, damage: 15, sound: "https://assets.mixkit.co/active_storage/sfx/2027/2027-preview.mp3" },
  { id: "hammer", label: "Hammer", icon: <Hammer className="h-5 w-5" />, damage: 20, sound: "https://assets.mixkit.co/active_storage/sfx/1647/1647-preview.mp3" },
];

const DEFEAT_SOUND = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";

const GamePage = () => {
  const navigate = useNavigate();
  const { buddyImage, health, maxHealth, damage, resetGame, isGameOver } = useGame();
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [attackAnimation, setAttackAnimation] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (!buddyImage) {
      navigate("/");
    }
  }, [buddyImage, navigate]);
  
  useEffect(() => {
    if (isGameOver && audioRef.current) {
      audioRef.current.src = DEFEAT_SOUND;
      audioRef.current.play();
    }
  }, [isGameOver]);
  
  const handleAttack = (attackId: string, damageAmount: number, soundUrl: string) => {
    if (isAnimating || isGameOver) return;
    
    setActiveAttack(attackId);
    setIsAnimating(true);
    
    if (attackId === "punch") {
      setAttackAnimation("animate-zoom");
    } else if (attackId === "kick") {
      setAttackAnimation("animate-bounce-off");
    }
    
    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.play();
    }
    
    setTimeout(() => {
      damage(damageAmount);
      
      setTimeout(() => {
        setIsAnimating(false);
        setActiveAttack(null);
        setAttackAnimation("");
      }, 300);
    }, 200);
  };
  
  const getHealthColor = () => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    return "bg-rage-danger";
  };
  
  if (!buddyImage) {
    return null;
  }
  
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
        
        <div className="mb-8">
          <div 
            className={`buddy-container w-3/4 mx-auto overflow-hidden ${isAnimating ? attackAnimation : ""} ${isGameOver ? "opacity-50" : ""}`}
          >
            <img 
              src={buddyImage.src} 
              alt={buddyImage.alt} 
              className="object-cover w-full h-full"
            />
            
            {isGameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-2xl font-bold text-rage-danger">DEFEATED!</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Attack Options</h3>
          <div className="grid grid-cols-3 gap-3">
            {ATTACK_OPTIONS.map((attack) => (
              <Button
                key={attack.id}
                onClick={() => handleAttack(attack.id, attack.damage, attack.sound)}
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
        
        {isGameOver && (
          <Button 
            onClick={resetGame}
            className="w-full rage-button flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Game</span>
          </Button>
        )}
        
        <div className="flex justify-between mt-6">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="px-4"
          >
            Back to Home
          </Button>
          <Button 
            onClick={() => navigate("/record-voice")}
            variant="outline"
            className="px-4"
          >
            Change Voice
          </Button>
        </div>
      </div>

      <audio ref={audioRef} />
    </Layout>
  );
};

export default GamePage;
