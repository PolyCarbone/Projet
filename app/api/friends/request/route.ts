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
        const { receiverId } = body

        if (!receiverId) {
            return NextResponse.json({ error: "ID du destinataire requis" }, { status: 400 })
        }

        if (receiverId === session.user.id) {
            return NextResponse.json(
                { error: "Vous ne pouvez pas vous ajouter vous-même" },
                { status: 400 }
            )
        }

        // Vérifier si une demande existe déjà
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { initiatorId: session.user.id, receiverId },
                    { initiatorId: receiverId, receiverId: session.user.id },
                ],
            },
        })

        if (existingFriendship) {
            return NextResponse.json(
                { error: "Une demande d'ami existe déjà" },
                { status: 400 }
            )
        }

        // Créer la demande d'ami
        const friendship = await prisma.friendship.create({
            data: {
                initiatorId: session.user.id,
                receiverId,
                status: "pending",
            },
        })

        // Créer une notification pour le destinataire
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: "friend_request",
                title: "Nouvelle demande d'ami",
                message: `${session.user.name} vous a envoyé une demande d'ami`,
                data: {
                    friendshipId: friendship.id,
                    senderId: session.user.id,
                },
            },
        })

        return NextResponse.json(friendship)
    } catch (error) {
        console.error("Failed to send friend request:", error)
        return NextResponse.json(
            { error: "Erreur lors de l'envoi de la demande d'ami" },
            { status: 500 }
        )
    }
}
