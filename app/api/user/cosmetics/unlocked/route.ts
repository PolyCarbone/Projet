import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma"; // Ton import prisma habituel
import { checkAndUnlockAllCosmetics } from "@/lib/cosmetics-service"; // Le service créé juste avant

export async function GET(request: NextRequest) {
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

        // 2. Récupération des paramètres (ex: ?type=avatar)
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type");

        // 3. Vérification des récompenses (Auto-Unlock)
        // On lance les vérifications maintenant pour être sûr que l'utilisateur voit
        // ce qu'il vient potentiellement de gagner.
        // Cette fonction vérifie TOUS les types de récompenses + les cosmétiques par défaut
        await checkAndUnlockAllCosmetics(session.user.id);

        // 4. Construction de la requête Prisma
        // On prépare le filtre : toujours l'ID utilisateur, et optionnellement le type
        const whereClause: any = {
            userId: session.user.id,
        };

        if (type) {
            whereClause.cosmetic = {
                type: type
            };
        }

        // 5. Récupération des items débloqués par l'utilisateur
        const unlockedItems = await prisma.userCosmetic.findMany({
            where: whereClause,
            include: {
                cosmetic: true // Important pour avoir l'image et la couleur
            },
            orderBy: {
                unlockedAt: 'desc' // Les plus récents en premier
            }
        });

        // 6. Formatage pour le front-end
        const unlockedIds = new Set(unlockedItems.map(item => item.cosmetic.id));
        const items = unlockedItems.map((item) => ({
            id: item.cosmetic.id,
            name: item.cosmetic.name,
            imageUrl: item.cosmetic.imageUrl,
            colorValue: item.cosmetic.colorValue,
            type: item.cosmetic.type
        }));

        // 6b. Pour les bannières : inclure aussi les bannières couleur par défaut
        // (colorValue défini, pas d'imageUrl) qui sont disponibles pour tous
        if (type === 'banner') {
            const defaultColorBanners = await prisma.cosmetic.findMany({
                where: {
                    type: 'banner',
                    colorValue: { not: null },
                    imageUrl: null,
                },
            });
            for (const cosmetic of defaultColorBanners) {
                if (!unlockedIds.has(cosmetic.id)) {
                    items.push({
                        id: cosmetic.id,
                        name: cosmetic.name,
                        imageUrl: cosmetic.imageUrl,
                        colorValue: cosmetic.colorValue,
                        type: cosmetic.type,
                    });
                }
            }
        }

        return NextResponse.json(items);

    } catch (error) {
        console.error("Error fetching unlocked cosmetics:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}