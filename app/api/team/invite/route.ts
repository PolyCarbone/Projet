import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
        const { friendId } = body;

        if (!friendId) {
            return NextResponse.json(
                { error: "L'ID de l'ami est requis" },
                { status: 400 }
            );
        }

        // Get user's team
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                userId: session.user.id,
                status: "accepted",
            },
        });

        if (!teamMember) {
            return NextResponse.json(
                { error: "Vous n'êtes pas membre d'une équipe" },
                { status: 400 }
            );
        }

        // Check if friend is already in the team
        const friendTeamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: teamMember.teamId,
                    userId: friendId,
                },
            },
        });

        if (friendTeamMember) {
            return NextResponse.json(
                { error: "Cet ami est déjà membre de l'équipe" },
                { status: 400 }
            );
        }

        // Create pending team invitation
        const invitation = await prisma.teamMember.create({
            data: {
                teamId: teamMember.teamId,
                userId: friendId,
                role: "member",
                status: "pending",
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
        });

        // Create notification for the friend
        await prisma.notification.create({
            data: {
                userId: friendId,
                type: "team_invitation",
                title: `${session.user.name} vous a invité à rejoindre l'équipe ${invitation.team.name}`,
                message: `Cliquez pour accepter ou refuser l'invitation`,
                data: {
                    teamId: invitation.teamId,
                    inviterId: session.user.id,
                },
            },
        });

        return NextResponse.json({ invitation }, { status: 201 });
    } catch (error) {
        console.error("Failed to invite friend to team:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'invitation" },
            { status: 500 }
        );
    }
}
