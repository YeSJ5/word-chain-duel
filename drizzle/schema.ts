import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Game rooms table for multiplayer word chain games.
 * Stores game state, players, and current game progress.
 */
export const gameRooms = mysqlTable("game_rooms", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 16 }).notNull().unique(), // Unique shareable room identifier
  createdBy: int("createdBy").notNull(), // User ID of the player who created the room
  player1Id: int("player1Id").notNull(), // First player (creator)
  player2Id: int("player2Id"), // Second player (can be null until they join)
  status: mysqlEnum("status", ["waiting", "active", "completed"]).default("waiting").notNull(),
  currentWord: text("currentWord"), // The last valid word in the chain
  currentPlayerId: int("currentPlayerId"), // Whose turn it is
  player1Score: int("player1Score").default(0).notNull(),
  player2Score: int("player2Score").default(0).notNull(),
  player1Streak: int("player1Streak").default(0).notNull(),
  player2Streak: int("player2Streak").default(0).notNull(),
  usedWords: json("usedWords").$type<string[]>().notNull(), // Array of words already used in this game
  winner: int("winner"), // User ID of the winner (null until game ends)
  endReason: varchar("endReason", { length: 64 }), // "timeout", "invalid_word", "repeated_word"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = typeof gameRooms.$inferInsert;

/**
 * Game turns table to track individual word submissions.
 * Useful for game history and debugging.
 */
export const gameTurns = mysqlTable("game_turns", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 16 }).notNull(), // Foreign key to game_rooms.roomId
  playerId: int("playerId").notNull(), // User who submitted the word
  word: varchar("word", { length: 64 }).notNull(),
  isValid: int("isValid").default(1).notNull(), // 1 for valid, 0 for invalid
  validationReason: text("validationReason"), // Reason if invalid (e.g., "not a real word", "wrong starting letter")
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type GameTurn = typeof gameTurns.$inferSelect;
export type InsertGameTurn = typeof gameTurns.$inferInsert;