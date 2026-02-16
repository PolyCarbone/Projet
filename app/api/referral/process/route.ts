import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { referralCode } = await req.json()

        if (!referralCode || typeof referralCode !== "string") {
            return NextResponse.json(
                { error: "Code de parrainage invalide" },
                { status: 400 }
            )
        }

        // Vérifier que l'utilisateur n'est pas déjà parrainé
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referredBy: true },
        })

        if (currentUser?.referredBy) {
            return NextResponse.json(
                { error: "Vous avez déjà été parrainé" },
                { status: 400 }
            )
        }

        // Trouver le parrain via le code de parrainage
        const referrer = await prisma.user.findUnique({
            where: { referralCode },
            select: { id: true, username: true, name: true },
        })

        if (!referrer) {
            return NextResponse.json(
                { error: "Code de parrainage invalide" },
                { status: 404 }
            )
        }

        // Vérifier que le parrain n'est pas l'utilisateur lui-même
        if (referrer.id === session.user.id) {
            return NextResponse.json(
                { error: "Vous ne pouvez pas vous parrainer vous-même" },
                { status: 400 }
            )
        }

        // Lier le filleul au parrain
        await prisma.user.update({
            where: { id: session.user.id },
            data: { referredBy: referrer.id },
        })

        // L'amitié sera créée à la fin de l'onboarding

        return NextResponse.json({
            success: true,
            referrerName: referrer.username || referrer.name,
        })
    } catch (error) {
        console.error("Failed to process referral:", error)
        return NextResponse.json(
            { error: "Erreur lors du traitement du parrainage" },
            { status: 500 }
        )
    }
}
