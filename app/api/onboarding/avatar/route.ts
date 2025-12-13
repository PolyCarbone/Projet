import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const VALID_COLORS = [
    "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
    "#f97316", "#ef4444", "#eab308", "#06b6d4"
];

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { avatarColor } = body;

        // Validation
        if (!avatarColor || typeof avatarColor !== "string") {
            return NextResponse.json(
                { error: "Couleur d'avatar requise" },
                { status: 400 }
            );
        }

        if (!VALID_COLORS.includes(avatarColor)) {
            return NextResponse.json(
                { error: "Couleur non valide" },
                { status: 400 }
            );
        }

        // Mettre à jour l'utilisateur
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                avatarColor,
                onboardingStep: 3, // Passer à l'étape test carbone
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving avatar:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
