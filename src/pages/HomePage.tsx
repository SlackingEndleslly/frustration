
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Heart, Zap } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
        <div className="rage-card mb-8 animate-float">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient bg-gradient-to-r from-rage via-rage-accent to-rage-highlight bg-clip-text text-transparent">
            BUDDY BEAT
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-rage-accent">
            RAGE FEST
          </h2>
          
          <p className="text-lg mb-8 text-muted-foreground">
            Upload a buddy. Record your rage. Beat the frustration out!
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="h-6 w-6 text-rage-danger" />
            <Zap className="h-8 w-8 text-rage-highlight animate-pulse" />
            <Heart className="h-6 w-6 text-rage-danger" />
          </div>
          
          <Button 
            onClick={() => navigate("/select-buddy")}
            className="rage-button w-full text-xl animate-pulse-rage"
          >
            BEGIN RAGE
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-4">
          Unleash your frustration, virtually!
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
