import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/challenges/reroll
 * Re-roll les défis quotidiens de l'utilisateur :
 * - Supprime le défi quotidien actif ciblé (ou tous si aucun id fourni)
 * - Propose 3 nouveaux défis quotidiens aléatoires (auto-acceptés)
 * Body: { userChallengeId?: string }
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
        const { userChallengeId } = body

        // Récupérer tous les défis quotidiens actifs de l'utilisateur
        const activeDailyChallenges = await prisma.userChallenge.findMany({
            where: {
                userId: session.user.id,
                status: 'active',
                challenge: { type: 'daily' },
            },
            include: { challenge: true },
        })

        // IDs des défis quotidiens déjà actifs (à exclure du re-roll)
        const activeIds = activeDailyChallenges.map(uc => uc.challengeId)

        // Déterminer quel(s) défi(s) re-roller
        let idsToDeactivate: string[]
        if (userChallengeId) {
            // Re-roll d'un seul défi
            idsToDeactivate = [userChallengeId]
        } else {
            // Re-roll de tous les défis quotidiens actifs
            idsToDeactivate = activeDailyChallenges.map(uc => uc.id)
        }

        const challengeIdsDeactivated: string[] = []

        // Marquer les défis ciblés comme "changed"
        for (const ucId of idsToDeactivate) {
            const uc = await prisma.userChallenge.update({
                where: { id: ucId },
                data: { status: 'changed', wasChanged: true },
            })
            challengeIdsDeactivated.push(uc.challengeId)
        }

        // IDs des défis encore actifs après déactivation
        const remainingActiveIds = activeIds.filter(id => !challengeIdsDeactivated.includes(id))

        // Récupérer tous les défis quotidiens disponibles (non actifs restants, non déjà utilisés récemment)
        const allDailyChallenges = await prisma.challenge.findMany({
            where: {
                type: 'daily',
                isActive: true,
                id: { notIn: remainingActiveIds },
            },
        })

        // Mélanger et prendre les défis nécessaires
        const needed = idsToDeactivate.length
        const shuffled = allDailyChallenges.sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, Math.min(needed, shuffled.length))

        // Créer les nouveaux UserChallenges actifs
        const newUserChallenges = await Promise.all(
            selected.map(challenge =>
                prisma.userChallenge.create({
                    data: {
                        userId: session.user.id,
                        challengeId: challenge.id,
                        status: 'active',
                        startedAt: new Date(),
                    },
                    include: { challenge: true },
                })
            )
        )

        return NextResponse.json({
            success: true,
            newUserChallenges: newUserChallenges.map(uc => ({
                id: uc.id,
                status: uc.status,
                startedAt: uc.startedAt,
                challenge: {
                    id: uc.challenge.id,
                    title: uc.challenge.title,
                    co2Impact: uc.challenge.co2Impact,
                },
            })),
        })
    } catch (error) {
        console.error('Erreur re-roll défi:', error)
        return NextResponse.json(
            { error: 'Erreur lors du re-roll du défi' },
            { status: 500 }
        )
    }
}
