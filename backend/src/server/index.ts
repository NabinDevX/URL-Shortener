import { router } from "./trpc";
import { userRouter, urlRouter, subscriptionRouter } from "./routers";

export const appRouter = router({
  user: userRouter,
  url: urlRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
