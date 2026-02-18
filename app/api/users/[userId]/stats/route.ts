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

        const [completedChallenges, acceptedFriendships, user] = await Promise.all([
            prisma.userChallenge.count({
                where: {
                    userId,
                    status: "completed",
                },
            }),
            prisma.friendship.count({
                where: {
                    OR: [
                        { initiatorId: userId, status: "accepted" },
                        { receiverId: userId, status: "accepted" },
                    ],
                },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true },
            }),
        ])

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            completedChallenges,
            currentStreak: user.currentStreak || 0,
            friendsCount: acceptedFriendships,
        })
    } catch (error) {
        console.error("Error fetching user stats:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des statistiques" },
            { status: 500 }
        )
    }
}
