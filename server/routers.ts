import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { gameRouter } from "./gameRouter";
import { authRouter } from "./authRouter";

export const appRouter = router({
  system: systemRouter,
  game: gameRouter,
  auth: authRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
