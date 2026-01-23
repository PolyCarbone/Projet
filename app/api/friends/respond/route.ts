import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const body = await req.json()
        const { friendshipId, action } = body

        if (!friendshipId || !action) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
        }

        if (!["accept", "reject"].includes(action)) {
            return NextResponse.json({ error: "Action invalide" }, { status: 400 })
        }

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId },
            include: {
                initiator: true,
            },
        })

        if (!friendship || friendship.receiverId !== session.user.id) {
            return NextResponse.json({ error: "Demande d'ami non trouvée" }, { status: 404 })
        }

        if (friendship.status !== "pending") {
            return NextResponse.json(
                { error: "Cette demande a déjà été traitée" },
                { status: 400 }
            )
        }

        const newStatus = action === "accept" ? "accepted" : "rejected"

        const updatedFriendship = await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: newStatus },
        })

        // Si acceptée, créer une notification pour l'initiateur
        if (action === "accept") {
            await prisma.notification.create({
                data: {
                    userId: friendship.initiatorId,
                    type: "friend_request_accepted",
                    title: "Demande d'ami acceptée",
                    message: `${session.user.name} a accepté votre demande d'ami`,
                    data: {
                        friendshipId: friendship.id,
                        accepterId: session.user.id,
                    },
                },
            })
        }

        return NextResponse.json(updatedFriendship)
    } catch (error) {
        console.error("Failed to respond to friend request:", error)
        return NextResponse.json(
            { error: "Erreur lors de la réponse à la demande d'ami" },
            { status: 500 }
        )
    }
}
