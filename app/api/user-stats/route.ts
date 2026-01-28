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

        // Récupérer les statistiques de l'utilisateur
        const [completedChallenges, acceptedFriendships, user] = await Promise.all([
            // Nombre de défis complétés
            prisma.userChallenge.count({
                where: {
                    userId: session.user.id,
                    status: "completed"
                }
            }),
            // Nombre d'amis (friendships acceptées)
            prisma.friendship.count({
                where: {
                    OR: [
                        { initiatorId: session.user.id, status: "accepted" },
                        { receiverId: session.user.id, status: "accepted" }
                    ]
                }
            }),
            // Streak de l'utilisateur
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: { currentStreak: true }
            })
        ])

        return NextResponse.json({
            completedChallenges,
            currentStreak: user?.currentStreak || 0,
            friendsCount: acceptedFriendships
        })
    } catch (error) {
        console.error("Error fetching user stats:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des statistiques" },
            { status: 500 }
        )
    }
}
