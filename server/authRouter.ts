import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateToken, verifyToken } from "./_core/auth";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

export const authRouter = router({
  /**
   * Get current authenticated user
   */
  me: publicProcedure.query(({ ctx }) => ctx.user),

  /**
   * Register a new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, hash password and store in database
      // For demo, we'll just generate a token
      const userId = Math.floor(Math.random() * 1000000);
      const token = generateToken({
        userId,
        email: input.email,
        name: input.name,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; ${Object.entries(cookieOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")}`);

      return {
        success: true,
        user: {
          id: userId,
          email: input.email,
          name: input.name,
        },
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, verify password against database
      // For demo, we'll just generate a token
      const userId = Math.floor(Math.random() * 1000000);
      const token = generateToken({
        userId,
        email: input.email,
        name: input.email.split("@")[0],
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; ${Object.entries(cookieOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")}`);

      return {
        success: true,
        user: {
          id: userId,
          email: input.email,
          name: input.email.split("@")[0],
        },
      };
    }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),

  /**
   * Demo login - for quick testing
   */
  demoLogin: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const demoName = input.name || `Player_${Math.floor(Math.random() * 10000)}`;
      const demoEmail = `${demoName}@demo.local`;
      const userId = Math.floor(Math.random() * 1000000);

      const token = generateToken({
        userId,
        email: demoEmail,
        name: demoName,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; ${Object.entries(cookieOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")}`);

      return {
        success: true,
        user: {
          id: userId,
          email: demoEmail,
          name: demoName,
        },
      };
    }),
});
