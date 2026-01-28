import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        // Récupérer tous les défis complétés de l'utilisateur avec du CO2 économisé
        const completedChallenges = await prisma.userChallenge.findMany({
            where: {
                userId: session.user.id,
                status: "completed",
                co2Saved: {
                    gt: 0
                },
                completedAt: {
                    not: null
                }
            },
            orderBy: {
                completedAt: "asc"
            },
            select: {
                completedAt: true,
                co2Saved: true
            }
        })

        if (completedChallenges.length === 0) {
            return NextResponse.json([])
        }

        // Calculer le CO2 cumulatif
        let cumulativeCO2 = 0
        const carbonSavingsData = completedChallenges.map((challenge) => {
            cumulativeCO2 += challenge.co2Saved || 0
            return {
                date: challenge.completedAt!.toISOString(),
                cumulativeCO2Saved: parseFloat(cumulativeCO2.toFixed(2))
            }
        })

        return NextResponse.json(carbonSavingsData)
    } catch (error) {
        console.error("Error fetching carbon savings timeline:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des données" },
            { status: 500 }
        )
    }
}
