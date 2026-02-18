import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  try {
    // 1. Récupérer les stats actuelles de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        totalCO2Saved: true,
        currentStreak: true,
        _count: {
          select: { referrals: true } // On compte les parrainages
        }
      }
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    // 2. Récupérer tous les paliers de récompense, triés par ordre croissant
    const thresholds = await prisma.rewardThreshold.findMany({
      where: { isActive: true },
      orderBy: { threshold: 'asc' },
      include: { cosmetic: true }
    });

    // 3. Fonction helper pour calculer la progression
    const calculateProgress = (currentValue: number, type: string) => {
      // Filtrer les paliers de ce type (ex: "referral")
      const typeThresholds = thresholds.filter(t => t.type === type);
      
      // Trouver le PROCHAIN palier non atteint
      // (On cherche le premier palier dont la valeur est supérieure à la valeur actuelle)
      const nextThreshold = typeThresholds.find(t => t.threshold > currentValue);

      // Si on a fini tous les paliers, on prend le dernier pour afficher 100%
      const lastThreshold = typeThresholds[typeThresholds.length - 1];

      if (!nextThreshold) {
        // Tous les paliers sont débloqués
        return {
          current: currentValue,
          target: lastThreshold ? lastThreshold.threshold : currentValue,
          reward: null, // Plus de récompense à gagner
          isCompleted: true
        };
      }

      return {
        current: currentValue,
        target: nextThreshold.threshold,
        reward: nextThreshold.cosmetic,
        isCompleted: false
      };
    };

    // 4. Construire la réponse
    const data = [
      {
        id: "referral",
        label: "Parrainages",
        ...calculateProgress(user._count.referrals, "referral")
      },
      {
        id: "streak",
        label: "Jours consécutifs",
        ...calculateProgress(user.currentStreak, "streak")
      },
      {
        id: "co2_personal", // Attention à bien utiliser le même string que dans ta DB (co2_personal vs co2_global)
        label: "CO2 Économisé (kg)",
        ...calculateProgress(user.totalCO2Saved, "co2_personal")
      }
    ];

    return NextResponse.json(data);

  } catch (error) {
    console.error("[PROGRESS_API]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}