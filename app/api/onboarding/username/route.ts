import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
        const { username } = body;

        // Validation
        if (!username || typeof username !== "string") {
            return NextResponse.json(
                { error: "Pseudo requis" },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json(
                { error: "Le pseudo doit contenir au moins 3 caractères" },
                { status: 400 }
            );
        }

        if (username.length > 20) {
            return NextResponse.json(
                { error: "Le pseudo ne peut pas dépasser 20 caractères" },
                { status: 400 }
            );
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return NextResponse.json(
                { error: "Le pseudo ne peut contenir que des lettres, chiffres et underscores" },
                { status: 400 }
            );
        }

        // Vérifier si le pseudo est déjà pris
        const existingUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: "insensitive",
                },
                NOT: {
                    id: session.user.id
                }
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Ce pseudo est déjà pris" },
                { status: 409 }
            );
        }

        // Mettre à jour l'utilisateur
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                username,
                onboardingStep: 2, // Passer à l'étape avatar
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving username:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
