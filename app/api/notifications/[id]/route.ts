import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()

        const notification = await prisma.notification.findUnique({
            where: { id },
        })

        if (!notification || notification.userId !== session.user.id) {
            return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 })
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: body.isRead },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Failed to update notification:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour de la notification" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id } = await params

        const notification = await prisma.notification.findUnique({
            where: { id },
        })

        if (!notification || notification.userId !== session.user.id) {
            return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 })
        }

        await prisma.notification.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete notification:", error)
        return NextResponse.json(
            { error: "Erreur lors de la suppression de la notification" },
            { status: 500 }
        )
    }
}
