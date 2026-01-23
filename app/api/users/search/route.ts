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
        const query = searchParams.get("q")

        if (!query || query.trim().length < 2) {
            return NextResponse.json([])
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        id: {
                            not: session.user.id,
                        },
                    },
                    {
                        OR: [
                            {
                                username: {
                                    contains: query,
                                    mode: "insensitive",
                                },
                            },
                            {
                                name: {
                                    contains: query,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                avatarBorderColor: true,
                totalCO2Saved: true,
            },
            take: 10,
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("Failed to search users:", error)
        return NextResponse.json(
            { error: "Erreur lors de la recherche d'utilisateurs" },
            { status: 500 }
        )
    }
}
