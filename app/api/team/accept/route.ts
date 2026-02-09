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
        const { teamId } = body;

        if (!teamId) {
            return NextResponse.json(
                { error: "L'ID de l'équipe est requis" },
                { status: 400 }
            );
        }

        // Update team member status to accepted
        const teamMember = await prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId: session.user.id,
                },
            },
            data: {
                status: "accepted",
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Create notification for team creator
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { creatorId: true },
        });

        if (team) {
            await prisma.notification.create({
                data: {
                    userId: team.creatorId,
                    type: "team_join",
                    title: `${session.user.name} a rejoint votre équipe`,
                    message: `${session.user.name} a accepté votre invitation`,
                    data: {
                        teamId: teamId,
                        userId: session.user.id,
                    },
                },
            });
        }

        return NextResponse.json({ teamMember });
    } catch (error) {
        console.error("Failed to accept team invitation:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'acceptation de l'invitation" },
            { status: 500 }
        );
    }
}
