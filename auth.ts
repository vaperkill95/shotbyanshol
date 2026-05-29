import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  // Block signup after the first admin exists.
  // Setup page is the only path that ever calls signup, but this is the
  // backstop in case anyone finds the API endpoint directly.
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const existing = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
          if (existing.length > 0) {
            throw new Error('Sign-up is closed.');
          }
          return { data: newUser };
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : [],
});

export type Session = typeof auth.$Infer.Session;
