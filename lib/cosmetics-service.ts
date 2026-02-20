import { prisma } from "@/lib/prisma";

/**
 * Vérifie et débloque les cosmétiques pour un utilisateur selon un type de récompense
 */
export async function checkAndUnlockCosmetics(userId: string, type: 'referral' | 'streak' | 'co2_personal') {
    // 1. Récupérer la valeur actuelle de la stat pour cet utilisateur
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            totalCO2Saved: true,
            currentStreak: true,
            _count: {
                select: { referrals: true }
            }
        }
    });

    if (!user) return;

    // Déterminer la valeur à comparer selon le type
    let currentValue = 0;
    if (type === 'referral') currentValue = user._count.referrals;
    if (type === 'streak') currentValue = user.currentStreak;
    if (type === 'co2_personal') currentValue = user.totalCO2Saved;

    // 2. Trouver tous les paliers de ce type atteints par l'utilisateur
    const reachedThresholds = await prisma.rewardThreshold.findMany({
        where: {
            type: type,
            threshold: { lte: currentValue },
            isActive: true
        }
    });

    // 3. Pour chaque palier atteint, on essaie de l'ajouter à l'utilisateur
    // L'utilisation de 'connectOrCreate' ou un check préalable évite les doublons
    const unlockPromises = reachedThresholds.map(threshold =>
        prisma.userCosmetic.upsert({
            where: {
                userId_cosmeticId: {
                    userId: userId,
                    cosmeticId: threshold.cosmeticId
                }
            },
            update: {}, // Si déjà possédé, on ne fait rien
            create: {
                userId: userId,
                cosmeticId: threshold.cosmeticId,
                source: type
            }
        })
    );

    await Promise.all(unlockPromises);
}

/**
 * Vérifie et débloque TOUS les types de récompenses pour un utilisateur
 * Utile pour rattraper les récompenses qui auraient dû être débloquées
 */
export async function checkAndUnlockAllCosmetics(userId: string) {
    await Promise.all([
        checkAndUnlockCosmetics(userId, 'referral'),
        checkAndUnlockCosmetics(userId, 'streak'),
        checkAndUnlockCosmetics(userId, 'co2_personal'),
        grantDefaultCosmetics(userId),
    ]);
}

/**
 * Accorde les cosmétiques par défaut à un utilisateur
 * Ces cosmétiques sont disponibles pour tous sans condition
 */
export async function grantDefaultCosmetics(userId: string) {
    // Récupérer tous les cosmétiques qui n'ont pas de RewardThreshold associé
    // (ce qui signifie qu'ils sont disponibles par défaut)
    const defaultCosmetics = await prisma.cosmetic.findMany({
        where: {
            rewardThresholds: {
                none: {} // Pas de palier de déblocage = disponible par défaut
            }
        }
    });

    // Débloquer chacun de ces cosmétiques pour l'utilisateur
    const unlockPromises = defaultCosmetics.map(cosmetic =>
        prisma.userCosmetic.upsert({
            where: {
                userId_cosmeticId: {
                    userId: userId,
                    cosmeticId: cosmetic.id
                }
            },
            update: {},
            create: {
                userId: userId,
                cosmeticId: cosmetic.id,
                source: 'default'
            }
        })
    );

    await Promise.all(unlockPromises);
}