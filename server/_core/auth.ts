import jwt from "jsonwebtoken";
import { ENV } from "./env";

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, ENV.jwtSecret, {
    expiresIn: "7d",
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as AuthPayload;
    return decoded;
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return null;
  }
}

/**
 * Register a new user and return a token
 */
export async function registerUser(email: string, name: string, password: string): Promise<{ token: string; userId: number }> {
  // In production, hash the password and store in database
  // For now, this is a placeholder
  const userId = Math.floor(Math.random() * 1000000);
  const token = generateToken({
    userId,
    email,
    name,
  });
  return { token, userId };
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<{ token: string; userId: number } | null> {
  // In production, query database and verify password hash
  // For now, this is a placeholder
  try {
    const userId = Math.floor(Math.random() * 1000000);
    const token = generateToken({
      userId,
      email,
      name: email.split("@")[0],
    });
    return { token, userId };
  } catch (error) {
    console.error("[Auth] Authentication failed:", error);
    return null;
  }
}
