import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./generated/prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
        autoSignIn: false
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Force la sélection du compte Google à chaque connexion/inscription
            accessType: "offline",
            prompt: "select_account",
        },
    },

    // Session configuration with cookie-based storage
    session: {
        // Session expires after 7 days (in seconds)
        expiresIn: 60 * 60 * 24 * 7, // 7 days

        // Update session expiration every 1 day
        updateAge: 60 * 60 * 24, // 1 day

        // Session is considered fresh if created within last 24 hours
        freshAge: 60 * 60 * 24, // 1 day

        // Enable cookie caching to reduce database calls
        // This stores session data in a signed cookie for faster access
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration: 5 minutes
        }
    },

    advanced: {
        cookiePrefix: "polycarbone"
    }
});