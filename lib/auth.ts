import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./generated/prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Configuration du transporteur email (Brevo SMTP)
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
});

// Fonction utilitaire pour envoyer des emails
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || "PolyCarbone <noreply@polycarbone.com>",
        to,
        subject,
        html,
    });
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    user: {
        additionalFields: {
            username: {
                type: "string",
                unique: true,
                required: false,
            },
            onboardingStep: {
                type: "number",
                default: 0,
            },
        }
    },

    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        // Ne pas bloquer la connexion si l'email n'est pas vérifié
        requireEmailVerification: false,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Réinitialisez votre mot de passe - PolyCarbone",
                html: `
                    <h1>Réinitialisation de mot de passe</h1>
                    <p>Bonjour ${user.name || ""},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
                    <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                    <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px;">Réinitialiser mon mot de passe</a>
                    <p>Ce lien expire dans 1 heure.</p>
                    <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                    <p>L'équipe PolyCarbone</p>
                `,
            });
        },
    },

    // Configuration pour l'envoi d'email de vérification
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Vérifiez votre adresse email - PolyCarbone",
                html: `
                    <h1>Bienvenue sur PolyCarbone !</h1>
                    <p>Bonjour ${user.name || ""},</p>
                    <p>Merci de vous être inscrit. Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
                    <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px;">Vérifier mon email</a>
                    <p>Ce lien expire dans 24 heures.</p>
                    <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
                    <p>L'équipe PolyCarbone</p>
                `,
            });
        },
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
        // Session expires after 30 days (in seconds)
        expiresIn: 60 * 60 * 24 * 30, // 30 days

        // Update session expiration every 1 day
        updateAge: 60 * 60 * 24, // 1 day

        // Session is considered fresh if created within last 24 hours
        freshAge: 60 * 60 * 24, // 1 day

        // Disable cookie caching to always fetch fresh session data from database
        cookieCache: {
            enabled: false
        }
    },

    advanced: {
        cookiePrefix: "polycarbone"
    }
});