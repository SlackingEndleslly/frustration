
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "./contexts/GameContext";

import HomePage from "./pages/HomePage";
import SelectBuddyPage from "./pages/SelectBuddyPage";
import RecordVoicePage from "./pages/RecordVoicePage";
import GamePage from "./pages/GamePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/select-buddy" element={<SelectBuddyPage />} />
            <Route path="/record-voice" element={<RecordVoicePage />} />
            <Route path="/play-game" element={<GamePage />} />
            {/* Add redirect from play-page to play-game */}
            <Route path="/play-page" element={<Navigate to="/play-game" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
