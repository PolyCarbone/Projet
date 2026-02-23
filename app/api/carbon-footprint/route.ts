import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
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
        const {
            totalFootprint,
            transport,
            alimentation,
            logement,
            divers,
            serviceSocietal,
        } = body;

        // Valider que totalFootprint est présent
        if (typeof totalFootprint !== "number") {
            return NextResponse.json(
                { error: "totalFootprint est requis et doit être un nombre" },
                { status: 400 }
            );
        }

        // Créer ou mettre à jour le bilan carbone de l'utilisateur (upsert)
        const carbonFootprint = await prisma.carbonFootprint.upsert({
            where: {
                userId: session.user.id,
            },
            update: {
                totalFootprint,
                transport: transport ?? null,
                alimentation: alimentation ?? null,
                logement: logement ?? null,
                divers: divers ?? null,
                serviceSocietal: serviceSocietal ?? null,
            },
            create: {
                userId: session.user.id,
                totalFootprint,
                transport: transport ?? null,
                alimentation: alimentation ?? null,
                logement: logement ?? null,
                divers: divers ?? null,
                serviceSocietal: serviceSocietal ?? null,
            },
        });

        // Marquer l'onboarding comme terminé si c'est le premier test
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                onboardingStep: 4,
            },
            select: { referredBy: true },
        });

        // Si l'utilisateur a été parrainé, créer l'amitié avec le parrain
        if (updatedUser.referredBy) {
            const existingFriendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { initiatorId: updatedUser.referredBy, receiverId: session.user.id },
                        { initiatorId: session.user.id, receiverId: updatedUser.referredBy },
                    ],
                },
            });

            if (!existingFriendship) {
                await prisma.friendship.create({
                    data: {
                        initiatorId: updatedUser.referredBy,
                        receiverId: session.user.id,
                        status: "accepted",
                    },
                });
            }
        }

        return NextResponse.json(carbonFootprint, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la sauvegarde du bilan carbone:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Vérifier l'authentification
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Récupérer le bilan carbone unique de l'utilisateur
        const carbonFootprint = await prisma.carbonFootprint.findUnique({
            where: {
                userId: session.user.id,
            },
        });

        // Récupérer les défis complétés avec le CO2 économisé par catégorie
        const completedChallenges = await prisma.userChallenge.findMany({
            where: {
                userId: session.user.id,
                status: "completed",
                co2Saved: { gt: 0 },
            },
            select: {
                co2Saved: true,
                challenge: {
                    select: { category: true },
                },
            },
        });

        // Agréger les économies par catégorie
        const co2SavedByCategory: Record<string, number> = {};
        for (const uc of completedChallenges) {
            const cat = uc.challenge.category;
            co2SavedByCategory[cat] = (co2SavedByCategory[cat] ?? 0) + (uc.co2Saved ?? 0);
        }

        return NextResponse.json({
            ...carbonFootprint,
            co2SavedByCategory,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des bilans carbone:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
