import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // In demo mode without OAuth, always provide a mock user
  if (!process.env.OAUTH_SERVER_URL) {
    user = {
      id: 1,
      openId: 'demo-user',
      name: 'Demo User',
      email: 'demo@harmonic-oracle.local',
      loginMethod: 'demo',
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      preferredCognitiveMode: 'balanced' as const,
    };
  } else {
    // OAuth is configured, try to authenticate
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication failed, user remains null
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
