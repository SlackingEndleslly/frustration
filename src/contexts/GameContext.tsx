
import { ReactNode, createContext, useContext, useState } from "react";

export type BuddyImage = {
  id: string;
  src: string;
  alt: string;
};

type GameContextType = {
  buddyImage: BuddyImage | null;
  voiceRecording: string | null;
  health: number;
  maxHealth: number;
  isGameOver: boolean;
  setBuddyImage: (image: BuddyImage) => void;
  setVoiceRecording: (audioUrl: string) => void;
  damage: (amount: number) => void;
  resetGame: () => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const maxHealth = 100;
  const [buddyImage, setBuddyImage] = useState<BuddyImage | null>(null);
  const [voiceRecording, setVoiceRecording] = useState<string | null>(null);
  const [health, setHealth] = useState(maxHealth);

  const damage = (amount: number) => {
    setHealth((prevHealth) => {
      const newHealth = Math.max(0, prevHealth - amount);
      return newHealth;
    });
  };

  const resetGame = () => {
    setHealth(maxHealth);
  };

  return (
    <GameContext.Provider
      value={{
        buddyImage,
        voiceRecording,
        health,
        maxHealth,
        isGameOver: health <= 0,
        setBuddyImage,
        setVoiceRecording,
        damage,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
