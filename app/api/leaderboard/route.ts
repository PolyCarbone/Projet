import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * GET /api/leaderboard
 * Récupère le classement mondial des utilisateurs par CO2 économisé
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            where: {
                totalCO2Saved: { gt: 0 },
                username: { not: null },
            },
            select: {
                id: true,
                name: true,
                username: true,
                totalCO2Saved: true,
                currentStreak: true,
                avatar: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                avatarBorderColor: true,
            },
            orderBy: {
                totalCO2Saved: "desc",
            },
            take: 50,
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("Error fetching leaderboard:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération du classement" },
            { status: 500 }
        )
    }
}
