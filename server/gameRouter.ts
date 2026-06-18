import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createGameRoom,
  getGameRoom,
  joinGameRoom,
  submitWord,
  endGameByTimeout,
  getGameTurns,
} from "./db";
import { validateWord } from "./wordValidation";

export const gameRouter = router({
  /**
   * Create a new game room and return the shareable room ID
   */
  createRoom: protectedProcedure.mutation(async ({ ctx }) => {
    const roomId = await createGameRoom(ctx.user.id);
    return { roomId };
  }),

  /**
   * Get the current state of a game room
   */
  getRoom: protectedProcedure.input(z.object({ roomId: z.string() })).query(async ({ input }) => {
    const room = await getGameRoom(input.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    return room;
  }),

  /**
   * Join an existing game room
   */
  joinRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await joinGameRoom(input.roomId, ctx.user.id);
      const room = await getGameRoom(input.roomId);
      return room;
    }),

  /**
   * Submit a word for validation and game state update
   */
  submitWord: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        word: z.string().min(1).max(64),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await getGameRoom(input.roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Verify it's the player's turn
      if (room.currentPlayerId !== ctx.user.id) {
        throw new Error("It is not your turn");
      }

      // Verify the game is active
      if (room.status !== "active") {
        throw new Error("Game is not active");
      }

      // Validate the word
      const usedWords = Array.isArray(room.usedWords) ? room.usedWords : [];
      const validation = await validateWord(input.word, room.currentWord, usedWords);

      // Submit the word and update game state
      await submitWord(input.roomId, ctx.user.id, input.word, validation.isValid, validation.reason);

      // Return updated room state
      const updatedRoom = await getGameRoom(input.roomId);
      return {
        ...updatedRoom,
        validation,
      };
    }),

  /**
   * End the game due to timeout
   */
  endGameByTimeout: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const room = await getGameRoom(input.roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Only the player whose turn it is can timeout
      if (room.currentPlayerId !== ctx.user.id) {
        throw new Error("Cannot timeout for another player");
      }

      await endGameByTimeout(input.roomId, ctx.user.id);
      const updatedRoom = await getGameRoom(input.roomId);
      return updatedRoom;
    }),

  /**
   * Get the turn history for a game room
   */
  getTurns: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input }) => {
      return await getGameTurns(input.roomId);
    }),

  /**
   * Poll for room updates (for real-time synchronization)
   */
  pollRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input }) => {
      const room = await getGameRoom(input.roomId);
      if (!room) {
        throw new Error("Room not found");
      }
      return room;
    }),
});
