import { prisma } from "@/lib/prisma";

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