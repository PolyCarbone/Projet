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
