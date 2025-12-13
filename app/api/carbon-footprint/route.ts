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
            rawData,
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
                rawData: rawData ?? null,
            },
            create: {
                userId: session.user.id,
                totalFootprint,
                transport: transport ?? null,
                alimentation: alimentation ?? null,
                logement: logement ?? null,
                divers: divers ?? null,
                serviceSocietal: serviceSocietal ?? null,
                rawData: rawData ?? null,
            },
        });

        // Marquer l'onboarding comme terminé si c'est le premier test
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                onboardingStep: 4,
                onboardingCompleted: true,
            },
        });

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

        return NextResponse.json(carbonFootprint);
    } catch (error) {
        console.error("Erreur lors de la récupération des bilans carbone:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
