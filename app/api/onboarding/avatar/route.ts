import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
    try {
        // Récupérer les avatars disponibles pour l'onboarding (avatars 1, 4, 6)
        const avatars = await prisma.cosmetic.findMany({
            where: {
                type: 'avatar',
                name: {
                    in: ['Avatar 1', 'Avatar 4', 'Avatar 6']
                }
            },
            select: {
                id: true,
                name: true,
                imageUrl: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ avatars });
    } catch (error) {
        console.error("Error fetching avatars:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}

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
        const { avatarId } = body;

        // Validation
        if (!avatarId || typeof avatarId !== "string") {
            return NextResponse.json(
                { error: "ID d'avatar requis" },
                { status: 400 }
            );
        }

        // Vérifier que l'avatar existe et est disponible pour l'onboarding
        const avatar = await prisma.cosmetic.findFirst({
            where: {
                id: avatarId,
                type: 'avatar',
                name: {
                    in: ['Avatar 1', 'Avatar 4', 'Avatar 6']
                }
            }
        });

        if (!avatar) {
            return NextResponse.json(
                { error: "Avatar non valide ou non disponible" },
                { status: 400 }
            );
        }

        // Mettre à jour l'utilisateur et ajouter le cosmétique à sa collection
        await prisma.$transaction([
            // Attribuer l'avatar à l'utilisateur
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    avatarId: avatarId,
                    onboardingStep: 3, // Passer à l'étape test carbone
                }
            }),
            // Ajouter le cosmétique à la collection de l'utilisateur
            prisma.userCosmetic.upsert({
                where: {
                    userId_cosmeticId: {
                        userId: session.user.id,
                        cosmeticId: avatarId
                    }
                },
                update: {},
                create: {
                    userId: session.user.id,
                    cosmeticId: avatarId,
                    source: 'onboarding'
                }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving avatar:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
