import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Auto-redirect to game if authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/game");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[oklch(0.93_0.05_30)] relative overflow-hidden flex items-center justify-center">
        {/* Memphis Floating Shapes */}
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-accent opacity-40 blur-lg" />
        <div className="absolute top-32 right-10 w-16 h-16 bg-[oklch(0.75_0.15_270)] opacity-30 rotate-45" />
        <div className="absolute bottom-20 left-1/4 w-24 h-6 bg-[oklch(0.85_0.15_60)] opacity-25" />

        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-black uppercase text-foreground mb-2 drop-shadow-lg">
            Word Chain
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold uppercase text-accent drop-shadow-md mb-6">
            Duel
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            Challenge your friends to a fast-paced word game. Start with any word, and keep the chain going!
          </p>
          <Button
            onClick={() => (window.location.href = `/api/oauth/login?returnPath=/game`)}
            className="h-14 text-lg font-bold uppercase bg-accent hover:bg-[oklch(0.72_0.15_150)] text-foreground shadow-lg"
          >
            Sign In to Play
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-accent" />
    </div>
  );
}
