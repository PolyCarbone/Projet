import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") || "accepted"

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { initiatorId: session.user.id, status },
                    { receiverId: session.user.id, status },
                ],
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        avatarBorderColor: true,
                        totalCO2Saved: true,
                        currentStreak: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        avatarBorderColor: true,
                        totalCO2Saved: true,
                        currentStreak: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        // Formater les données pour renvoyer l'ami (pas soi-même)
        const friends = friendships.map((friendship) => {
            const friend =
                friendship.initiatorId === session.user.id
                    ? friendship.receiver
                    : friendship.initiator

            return {
                ...friendship,
                friend,
            }
        })

        return NextResponse.json(friends)
    } catch (error) {
        console.error("Failed to fetch friends:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des amis" },
            { status: 500 }
        )
    }
}
