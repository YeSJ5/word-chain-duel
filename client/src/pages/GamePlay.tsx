import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef } from "react";
import { Loader2, Copy, Check } from "lucide-react";

interface GamePlayProps {
  roomId: string;
}

export default function GamePlay({ roomId }: GamePlayProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [word, setWord] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timer, setTimer] = useState(60);
  const [copied, setCopied] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval>>(null!);

  const roomQuery = trpc.game.getRoom.useQuery({ roomId });
  const submitWordMutation = trpc.game.submitWord.useMutation();
  const joinRoomMutation = trpc.game.joinRoom.useMutation();
  const endGameMutation = trpc.game.endGameByTimeout.useMutation();
  const utils = trpc.useUtils();

  const room = roomQuery.data;
  const isPlayer1 = user?.id === room?.player1Id;
  const isMyTurn = user?.id === room?.currentPlayerId;
  const gameOver = room?.status === "completed";
  const winner = room?.winner === user?.id;

  // Auto-join if player 2 visits the link
  useEffect(() => {
    if (room && !room.player2Id && user?.id !== room.player1Id && !joinRoomMutation.isPending) {
      joinRoomMutation.mutate({ roomId });
    }
  }, [room, user, roomId, joinRoomMutation]);

  // Auto-refetch room every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      roomQuery.refetch();
    }, 1000);
    return () => {
      clearInterval(interval);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [roomQuery]);

  // Timer logic
  useEffect(() => {
    if (!isMyTurn || gameOver) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    setTimer(60);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current as unknown as NodeJS.Timeout);
      }
    };
  }, [isMyTurn, gameOver]);

  const handleTimeout = async () => {
    try {
      await endGameMutation.mutateAsync({ roomId });
      await roomQuery.refetch();
    } catch (error) {
      console.error("Timeout error:", error);
    }
  };

  const handleSubmitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || validating || !isMyTurn || !room?.player2Id) return;

    setValidating(true);
    setValidationMessage(null);
    try {
      const result = await submitWordMutation.mutateAsync({
        roomId,
        word: word.trim(),
      });

      if (result.validation.isValid) {
        setValidationMessage({ type: "success", text: `✓ "${word.trim()}" accepted!` });
        setWord("");
        setTimeout(() => setValidationMessage(null), 2000);
      } else {
        setValidationMessage({ type: "error", text: `✗ ${result.validation.reason || "Invalid word"}` });
      }

      await utils.game.getRoom.invalidate({ roomId });
    } catch (error: any) {
      setValidationMessage({ type: "error", text: error.message || "Submission failed" });
      console.error("Submit error:", error);
    } finally {
      setValidating(false);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/game/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (roomQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-accent" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Room not found</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[oklch(0.93_0.05_30)] relative overflow-hidden pb-8">
      {/* Memphis Background Elements */}
      <div className="absolute top-5 right-8 w-16 h-16 rounded-full bg-accent opacity-30 blur-lg" />
      <div className="absolute bottom-32 left-8 w-20 h-4 bg-[oklch(0.75_0.15_270)] opacity-25" />
      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-foreground rounded-full opacity-40" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black uppercase text-foreground drop-shadow-lg">Word Chain</h1>
          <Button variant="ghost" size="sm" onClick={copyShareLink} className="text-sm font-semibold">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" /> Share
              </>
            )}
          </Button>
        </div>

        {/* Game Status */}
        {!gameOver && room.player2Id && room.status === "waiting" && (
          <div className="bg-accent text-foreground p-4 rounded-lg mb-6 text-center font-bold uppercase animate-pulse">
            Game Starting! Get Ready!
          </div>
        )}

        {gameOver && (
          <div className={`p-6 rounded-lg mb-6 text-center ${winner ? "bg-accent" : "bg-destructive"}`}>
            <p className="text-2xl font-black uppercase text-foreground drop-shadow-lg">
              {winner ? "🎉 You Won! 🎉" : "Game Over"}
            </p>
            <p className="text-sm mt-2 text-foreground opacity-90 capitalize">{room.endReason?.replace(/_/g, " ")}</p>
          </div>
        )}

        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`p-4 rounded-lg border-2 ${isPlayer1 ? "border-accent bg-accent bg-opacity-10" : "border-border"}`}>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Player 1</p>
            <p className="text-3xl font-black text-foreground">{room.player1Score}</p>
            <p className="text-xs text-muted-foreground mt-1">Streak: {room.player1Streak}</p>
          </div>
          <div className={`p-4 rounded-lg border-2 ${!isPlayer1 && room.player2Id ? "border-accent bg-accent bg-opacity-10" : "border-border"}`}>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Player 2</p>
            <p className="text-3xl font-black text-foreground">{room.player2Id ? room.player2Score : "-"}</p>
            <p className="text-xs text-muted-foreground mt-1">Streak: {room.player2Id ? room.player2Streak : "-"}</p>
          </div>
        </div>

        {/* Current Word */}
        {room.currentWord && (
          <div className="bg-card border-2 border-accent rounded-lg p-6 mb-8 text-center">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Current Word</p>
            <p className="text-4xl font-black text-accent drop-shadow-lg">{room.currentWord}</p>
            <p className="text-xs text-muted-foreground mt-3">
              Next word must start with:{" "}
              <span className="font-bold text-lg text-foreground">{room.currentWord[room.currentWord.length - 1].toUpperCase()}</span>
            </p>
          </div>
        )}

        {/* Turn Indicator & Timer */}
        <div className="bg-card border-2 border-border rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold uppercase text-muted-foreground">{isMyTurn ? "🎯 Your Turn" : `${isPlayer1 ? "Player 2" : "Player 1"}'s Turn`}</p>
            {isMyTurn && <div className={`text-2xl font-black ${timer <= 10 ? "text-destructive" : "text-accent"}`}>{timer}s</div>}
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className={`h-full transition-all ${timer <= 10 ? "bg-destructive" : "bg-accent"}`} style={{ width: `${(timer / 60) * 100}%` }} />
          </div>
        </div>

        {/* Word Input */}
        {!gameOver && isMyTurn && room.player2Id && (
          <form onSubmit={handleSubmitWord} className="mb-8">
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="Enter your word..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                disabled={validating}
                className="flex-1 h-12 text-lg font-semibold uppercase border-2 border-foreground"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!word.trim() || validating}
                className="h-12 px-6 font-bold uppercase bg-accent hover:bg-[oklch(0.72_0.15_150)] text-foreground"
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </Button>
            </div>
            {validationMessage && (
              <div
                className={`p-3 rounded text-sm font-semibold ${
                  validationMessage.type === "success" ? "bg-accent text-foreground" : "bg-destructive text-destructive-foreground"
                }`}
              >
                {validationMessage.text}
              </div>
            )}
          </form>
        )}

        {/* Waiting for Player 2 */}
        {!room.player2Id && (
          <div className="bg-card border-2 border-accent rounded-lg p-8 text-center">
            <p className="text-lg font-bold uppercase text-muted-foreground mb-4">Waiting for Player 2...</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-3 h-3 bg-accent rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Share this code with your friend:</p>
            <div className="bg-background p-3 rounded border-2 border-border inline-block">
              <p className="text-2xl font-black tracking-widest text-foreground">{roomId}</p>
            </div>
          </div>
        )}

        {/* Game Over Actions */}
        {gameOver && (
          <div className="flex gap-4">
            <Button onClick={() => setLocation("/")} className="flex-1 h-12 font-bold uppercase">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
