import type { Container } from "./container";
import type { Env } from "./env";

export type AppUser = { id: string; email: string; role: string };

export type AppVariables = {
  container: Container;
  user: AppUser | null;
};

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
