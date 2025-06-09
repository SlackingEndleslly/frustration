
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useGame } from "@/contexts/GameContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { resetGame } = useGame();

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <Layout title="FRUSTRATION RAGE FEST">
      <div className="rage-card max-w-md w-full mx-auto text-center">
        <div className="mb-8">
          <div className="mb-6 w-3/4 mx-auto home-float">
            <img 
              src="/lovable-uploads/10cb857d-3fd1-4d83-9395-82bb0dc17957.png" 
              alt="Company Logo" 
              className="object-contain w-full h-full home-float"
            />
          </div>
          <h1 className="text-3xl font-bold mb-4 home-float bg-gradient-to-r from-rage via-rage-accent to-rage-highlight bg-clip-text text-transparent">
            FRUSTRATION RAGE FEST
          </h1>
          <p className="text-lg text-muted-foreground mb-8 home-float">
            Vent your frustration by beating up your buddy! Upload a photo and let the rage begin.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/select-buddy")}
            className="rage-button w-full text-lg py-3 home-float"
          >
            Start Rage Session
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
