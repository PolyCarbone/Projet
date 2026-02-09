import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/challenges/complete
 * Marque un défi comme complété
 * Body: { userChallengeId: string, co2Saved?: number }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { userChallengeId, co2Saved } = body

        if (!userChallengeId) {
            return NextResponse.json(
                { error: 'ID du défi utilisateur requis' },
                { status: 400 }
            )
        }

        // Vérifier que le défi appartient à l'utilisateur
        const userChallenge = await prisma.userChallenge.findUnique({
            where: { id: userChallengeId },
            include: {
                challenge: true,
            },
        })

        if (!userChallenge) {
            return NextResponse.json(
                { error: 'Défi introuvable' },
                { status: 404 }
            )
        }

        if (userChallenge.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            )
        }

        if (userChallenge.status === 'completed') {
            return NextResponse.json(
                { error: 'Défi déjà complété' },
                { status: 400 }
            )
        }

        const now = new Date()
        const co2SavedValue = co2Saved ?? userChallenge.challenge.co2Impact

        // Utiliser une transaction pour garantir la cohérence
        const result = await prisma.$transaction(async (tx) => {
            // Mettre à jour le UserChallenge
            const updated = await tx.userChallenge.update({
                where: { id: userChallengeId },
                data: {
                    status: 'completed',
                    completedAt: now,
                    co2Saved: co2SavedValue,
                },
                include: {
                    challenge: true,
                },
            })

            // Mettre à jour les statistiques de l'utilisateur
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    totalCO2Saved: {
                        increment: co2SavedValue,
                    },
                    lastActivityDate: now,
                },
            })

            // Ajouter une entrée dans l'historique
            await tx.carbonFootprintHistory.create({
                data: {
                    userId: session.user.id,
                    totalFootprint: 0, // À calculer si nécessaire
                    createdAt: now,
                },
            })

            return updated
        })

        return NextResponse.json({
            success: true,
            userChallenge: {
                id: result.id,
                status: result.status,
                completedAt: result.completedAt,
                co2Saved: result.co2Saved,
                challenge: {
                    id: result.challenge.id,
                    title: result.challenge.title,
                },
            },
            totalCO2Saved: co2SavedValue,
        })
    } catch (error) {
        console.error('Erreur complétion défi:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la complétion du défi' },
            { status: 500 }
        )
    }
}
