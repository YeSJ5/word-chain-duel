import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function GameHome() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const createRoomMutation = trpc.game.createRoom.useMutation();

  const handleCreateGame = async () => {
    try {
      const result = await createRoomMutation.mutateAsync();
      setLocation(`/game/${result.roomId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[oklch(0.93_0.05_30)] relative overflow-hidden">
      {/* Memphis Floating Shapes */}
      <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-accent opacity-40 blur-lg" />
      <div className="absolute top-32 right-10 w-16 h-16 bg-[oklch(0.75_0.15_270)] opacity-30 rotate-45" />
      <div className="absolute bottom-20 left-1/4 w-24 h-6 bg-[oklch(0.85_0.15_60)] opacity-25" />
      <div className="absolute bottom-40 right-1/3 w-12 h-12 rounded-full border-4 border-foreground opacity-20" />

      {/* Decorative dots */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-foreground rounded-full opacity-40" />
      <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-foreground rounded-full opacity-30" />
      <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-foreground rounded-full opacity-35" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black uppercase text-foreground mb-2 drop-shadow-lg">
            Word Chain
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold uppercase text-accent drop-shadow-md mb-4">
            Duel
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Challenge your friends to a fast-paced word game. Start with any word, and keep the chain going!
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button
            onClick={handleCreateGame}
            disabled={createRoomMutation.isPending}
            className="h-14 text-lg font-bold uppercase bg-accent hover:bg-[oklch(0.72_0.15_150)] text-foreground shadow-lg hover:shadow-xl transition-all"
          >
            {createRoomMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Game"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-foreground opacity-20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground font-semibold">OR</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-14 text-lg font-bold uppercase border-2 border-foreground text-foreground hover:bg-muted"
            onClick={() => {
              const roomId = prompt("Enter the room code from your friend:");
              if (roomId) {
                setLocation(`/game/${roomId}`);
              }
            }}
          >
            Join Game
          </Button>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground max-w-md">
          <p className="font-semibold mb-2">How to play:</p>
          <p>Players take turns entering words that start with the last letter of the previous word. First to submit an invalid word loses!</p>
        </div>
      </div>
    </div>
  );
}
