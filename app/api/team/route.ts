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

        // Get user's team membership
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                userId: session.user.id,
                status: "accepted",
            },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        username: true,
                                        avatarId: true,
                                        avatar: {
                                            select: {
                                                id: true,
                                                name: true,
                                                imageUrl: true,
                                            },
                                        },
                                        avatarBorderColor: true,
                                        totalCO2Saved: true,
                                    },
                                },
                            },
                            where: {
                                status: "accepted",
                            },
                        },
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });

        if (!teamMember) {
            return NextResponse.json({ team: null });
        }

        // Calculate total CO2 saved by team members
        const totalCO2Saved = teamMember.team.members.reduce(
            (sum, member) => sum + (member.user.totalCO2Saved || 0),
            0
        );

        return NextResponse.json({
            team: {
                ...teamMember.team,
                totalCO2Saved,
                isCreator: teamMember.team.creatorId === session.user.id,
            },
        });
    } catch (error) {
        console.error("Failed to fetch team:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération de l'équipe" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Le nom de l'équipe est requis" },
                { status: 400 }
            );
        }

        // Check if user is already in a team
        const existingTeamMember = await prisma.teamMember.findFirst({
            where: {
                userId: session.user.id,
                status: "accepted",
            },
        });

        if (existingTeamMember) {
            return NextResponse.json(
                { error: "Vous êtes déjà membre d'une équipe" },
                { status: 400 }
            );
        }

        // Create new team
        const team = await prisma.team.create({
            data: {
                name,
                description,
                creatorId: session.user.id,
                members: {
                    create: {
                        userId: session.user.id,
                        role: "admin",
                        status: "accepted",
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatarId: true,
                                avatar: {
                                    select: {
                                        id: true,
                                        name: true,
                                        imageUrl: true,
                                    },
                                },
                                avatarBorderColor: true,
                                totalCO2Saved: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ team, isCreator: true }, { status: 201 });
    } catch (error) {
        console.error("Failed to create team:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création de l'équipe" },
            { status: 500 }
        );
    }
}
