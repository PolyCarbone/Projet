import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const { userId } = await params

        const completedChallenges = await prisma.userChallenge.findMany({
            where: {
                userId,
                status: "completed",
                co2Saved: { gt: 0 },
                completedAt: { not: null },
            },
            orderBy: { completedAt: "asc" },
            select: {
                completedAt: true,
                co2Saved: true,
            },
        })

        if (completedChallenges.length === 0) {
            return NextResponse.json([])
        }

        let cumulativeCO2 = 0
        const carbonSavingsData = completedChallenges.map((challenge) => {
            cumulativeCO2 += challenge.co2Saved || 0
            return {
                date: challenge.completedAt!.toISOString(),
                cumulativeCO2Saved: parseFloat(cumulativeCO2.toFixed(2)),
            }
        })

        return NextResponse.json(carbonSavingsData)
    } catch (error) {
        console.error("Error fetching user carbon savings timeline:", error)
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        )
    }
}
