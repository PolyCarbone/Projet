import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des notifications" },
            { status: 500 }
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: { isRead: true },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour des notifications" },
            { status: 500 }
        )
    }
}
