import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma";

// Vérifie si la requête est un email
function isEmail(query: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)
}

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
            return NextResponse.json({ users: [], emailNotFound: false, searchedEmail: null })
        }

        const emailSearch = isEmail(query.trim())

        // Récupérer les IDs des amis existants et demandes en cours
        const existingFriendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { initiatorId: session.user.id },
                    { receiverId: session.user.id },
                ],
                status: { in: ["accepted", "pending"] },
            },
            select: {
                initiatorId: true,
                receiverId: true,
            },
        })

        const excludedUserIds = new Set<string>([session.user.id])
        for (const f of existingFriendships) {
            excludedUserIds.add(f.initiatorId)
            excludedUserIds.add(f.receiverId)
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        id: {
                            notIn: Array.from(excludedUserIds),
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
                            ...(emailSearch
                                ? [
                                    {
                                        email: {
                                            equals: query.trim(),
                                            mode: "insensitive" as const,
                                        },
                                    },
                                ]
                                : []),
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

        return NextResponse.json({
            users,
            emailNotFound: emailSearch && users.length === 0,
            searchedEmail: emailSearch ? query.trim() : null,
        })
    } catch (error) {
        console.error("Failed to search users:", error)
        return NextResponse.json(
            { error: "Erreur lors de la recherche d'utilisateurs" },
            { status: 500 }
        )
    }
}
