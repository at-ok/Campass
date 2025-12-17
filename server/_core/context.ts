import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User, Session } from "../../drizzle/schema";
import { auth } from "../auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: User | null;
  session: Session | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const sessionData = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user: (sessionData?.user as User) ?? null,
    session: (sessionData?.session as Session) ?? null,
  };
}
