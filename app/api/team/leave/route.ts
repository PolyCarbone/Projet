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

        // Get the team to find creator
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { creatorId: true, name: true },
        });

        if (!team) {
            return NextResponse.json(
                { error: "Équipe non trouvée" },
                { status: 404 }
            );
        }

        // Check if user is the creator
        if (team.creatorId === session.user.id) {

            // if the user is the creator, the team is deleted and all members are removed


            // Notify all members that the team has been deleted
            // Do it first because after deleting the team, we won't be able to query the team members
            const teamMembers = await prisma.teamMember.findMany({
                where: { teamId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            for (const member of teamMembers) {
                if (member.userId !== session.user.id) {
                    await prisma.notification.create({
                        data: {
                            userId: member.userId,
                            type: "team_deleted",
                            title: `L'équipe ${team.name} a été supprimée`,
                            message: `L'équipe ${team.name} a été supprimée par le créateur`,
                            data: {
                                teamId: teamId,
                            },
                        },
                    });
                }
            }

            await prisma.team.delete({
                where: { id: teamId },
            });

        }
        else { // if the user is not the creator, they can leave the team

            // Delete team membership
            await prisma.teamMember.delete({
                where: {
                    teamId_userId: {
                        teamId,
                        userId: session.user.id,
                    },
                },
            });

            // Notify team creator
            await prisma.notification.create({
                data: {
                    userId: team.creatorId,
                    type: "team_member_left",
                    title: `${session.user.name} a quitté votre équipe`,
                    message: `${session.user.name} a quitté l'équipe ${team.name}`,
                    data: {
                        teamId: teamId,
                        userId: session.user.id,
                    },
                },
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to leave team:", error);
        return NextResponse.json(
            { error: "Erreur lors de la tentative de quitter l'équipe" },
            { status: 500 }
        );
    }
}
