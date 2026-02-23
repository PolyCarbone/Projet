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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                username: true,
                createdAt: true,
                avatar: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                avatarBorderColor: true,
                usernameColor: true,
                banner: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        colorValue: true,
                    },
                },
                totalCO2Saved: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error fetching user public profile:", error)
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        )
    }
}
