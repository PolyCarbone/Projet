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

        // Update team member status to declined
        await prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId: session.user.id,
                },
            },
            data: {
                status: "declined",
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to decline team invitation:", error);
        return NextResponse.json(
            { error: "Erreur lors du refus de l'invitation" },
            { status: 500 }
        );
    }
}
