import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gameRooms, gameTurns } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createGameRoom(createdBy: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();

  await db.insert(gameRooms).values({
    roomId,
    createdBy,
    player1Id: createdBy,
    status: "waiting",
    usedWords: [],
  });

  return roomId;
}

export async function getGameRoom(roomId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(gameRooms)
    .where(eq(gameRooms.roomId, roomId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function joinGameRoom(roomId: string, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const room = await getGameRoom(roomId);
  if (!room) throw new Error("Room not found");
  if (room.player2Id) throw new Error("Room is full");

  await db
    .update(gameRooms)
    .set({ player2Id: playerId, status: "active", currentPlayerId: room.player1Id })
    .where(eq(gameRooms.roomId, roomId));
}

export async function submitWord(
  roomId: string,
  playerId: number,
  word: string,
  isValid: boolean,
  validationReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const room = await getGameRoom(roomId);
  if (!room) throw new Error("Room not found");

  await db.insert(gameTurns).values({
    roomId,
    playerId,
    word,
    isValid: isValid ? 1 : 0,
    validationReason,
  });

  if (isValid) {
    const isPlayer1 = playerId === room.player1Id;
    const newScore = isPlayer1 ? room.player1Score + 1 : room.player2Score + 1;
    const newStreak = isPlayer1 ? room.player1Streak + 1 : room.player2Streak + 1;
    const nextPlayerId = isPlayer1 ? room.player2Id : room.player1Id;
    const usedWords = Array.isArray(room.usedWords) ? room.usedWords : [];

    await db
      .update(gameRooms)
      .set({
        currentWord: word,
        currentPlayerId: nextPlayerId,
        ...(isPlayer1
          ? { player1Score: newScore, player1Streak: newStreak }
          : { player2Score: newScore, player2Streak: newStreak }),
        usedWords: [...usedWords, word.toLowerCase()],
      })
      .where(eq(gameRooms.roomId, roomId));
  } else {
    const winner = playerId === room.player1Id ? room.player2Id : room.player1Id;
    await db
      .update(gameRooms)
      .set({
        status: "completed",
        winner,
        endReason: "invalid_word",
      })
      .where(eq(gameRooms.roomId, roomId));
  }
}

export async function endGameByTimeout(roomId: string, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const room = await getGameRoom(roomId);
  if (!room) throw new Error("Room not found");

  const winner = playerId === room.player1Id ? room.player2Id : room.player1Id;
  await db
    .update(gameRooms)
    .set({
      status: "completed",
      winner,
      endReason: "timeout",
    })
    .where(eq(gameRooms.roomId, roomId));
}

export async function getGameTurns(roomId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameTurns)
    .where(eq(gameTurns.roomId, roomId))
    .orderBy(gameTurns.submittedAt);
}
