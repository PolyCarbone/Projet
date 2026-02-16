import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"
import crypto from "crypto"

// Configuration du transporteur email (Brevo SMTP)
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
})

function generateReferralCode(): string {
    return crypto.randomBytes(6).toString("hex")
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { email } = await req.json()

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Adresse email invalide" },
                { status: 400 }
            )
        }

        // Vérifier que l'email n'est pas celui de l'utilisateur connecté
        if (email.toLowerCase() === session.user.email.toLowerCase()) {
            return NextResponse.json(
                { error: "Vous ne pouvez pas vous parrainer vous-même" },
                { status: 400 }
            )
        }

        // Vérifier que l'email n'est pas déjà sur la plateforme
        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "Cet utilisateur est déjà inscrit sur PolyCarbone" },
                { status: 400 }
            )
        }

        // Récupérer ou générer le referral code de l'utilisateur
        let currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referralCode: true, username: true, name: true },
        })

        if (!currentUser) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            )
        }

        let referralCode = currentUser.referralCode

        if (!referralCode) {
            referralCode = generateReferralCode()
            await prisma.user.update({
                where: { id: session.user.id },
                data: { referralCode },
            })
        }

        // Construire le lien de parrainage
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
        const referralLink = `${baseUrl}/auth/portal?mode=signup&ref=${referralCode}`

        const senderName = currentUser.username
            ? `@${currentUser.username}`
            : currentUser.name

        // Envoyer l'email de parrainage
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || "PolyCarbone <noreply@polycarbone.com>",
            to: email,
            subject: `${senderName} vous invite sur PolyCarbone !`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #22c55e;">Vous êtes invité(e) sur PolyCarbone ! 🌿</h1>
                    <p>Bonjour,</p>
                    <p><strong>${senderName}</strong> vous invite à rejoindre <strong>PolyCarbone</strong>, 
                    l'application qui vous aide à réduire votre empreinte carbone au quotidien.</p>
                    <p>Relevez des défis écologiques, suivez vos économies de CO₂ et rejoignez une communauté engagée !</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${referralLink}" 
                           style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Rejoindre PolyCarbone
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        En vous inscrivant via ce lien, vous et ${senderName} recevrez des récompenses exclusives !
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 12px;">
                        Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
                    </p>
                    <p style="color: #999; font-size: 12px;">L'équipe PolyCarbone</p>
                </div>
            `,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to send referral email:", error)
        return NextResponse.json(
            { error: "Erreur lors de l'envoi de l'email de parrainage" },
            { status: 500 }
        )
    }
}
