import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
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

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                email: true,
                emailVerified: true,
                username: true,
                avatarColor: true,
                onboardingStep: true,
                onboardingCompleted: true,
                carbonFootprint: {
                    select: { id: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            email: user.email,
            emailVerified: user.emailVerified,
            username: user.username,
            avatarColor: user.avatarColor,
            onboardingStep: user.onboardingStep,
            onboardingCompleted: user.onboardingCompleted,
            hasCarbonFootprint: !!user.carbonFootprint,
        });
    } catch (error) {
        console.error("Error fetching onboarding status:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
