import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Get all pending team invitations for the user
        const invitations = await prisma.teamMember.findMany({
            where: {
                userId: session.user.id,
                status: "pending",
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        createdAt: true,
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                            },
                        },
                        members: {
                            where: {
                                status: "accepted",
                            },
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                joinedAt: "desc",
            },
        });

        return NextResponse.json({ invitations });
    } catch (error) {
        console.error("Failed to fetch team invitations:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des invitations" },
            { status: 500 }
        );
    }
}
