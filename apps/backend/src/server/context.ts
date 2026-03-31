import * as trpcExpress from "@trpc/server/adapters/express";
import type { Context } from "@/types";

export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions): Context => ({
  req,
  res,
});
