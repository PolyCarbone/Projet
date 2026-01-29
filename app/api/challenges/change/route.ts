import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/challenges/change
 * Change un défi actif pour un nouveau défi
 * Body: { currentUserChallengeId: string, newChallengeId: string }
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
        const { currentUserChallengeId, newChallengeId } = body

        if (!currentUserChallengeId || !newChallengeId) {
            return NextResponse.json(
                { error: 'IDs requis' },
                { status: 400 }
            )
        }

        // Vérifier le défi actuel
        const currentUserChallenge = await prisma.userChallenge.findUnique({
            where: { id: currentUserChallengeId },
        })

        if (!currentUserChallenge || currentUserChallenge.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Défi actuel introuvable' },
                { status: 404 }
            )
        }

        // Vérifier le nouveau défi
        const newChallenge = await prisma.challenge.findUnique({
            where: { id: newChallengeId },
        })

        if (!newChallenge || !newChallenge.isActive) {
            return NextResponse.json(
                { error: 'Nouveau défi non disponible' },
                { status: 400 }
            )
        }

        // Transaction pour changer le défi
        const result = await prisma.$transaction(async (tx) => {
            // Marquer l'ancien défi comme changé
            await tx.userChallenge.update({
                where: { id: currentUserChallengeId },
                data: {
                    status: 'changed',
                    wasChanged: true,
                },
            })

            // Créer le nouveau défi
            const newUserChallenge = await tx.userChallenge.create({
                data: {
                    userId: session.user.id,
                    challengeId: newChallengeId,
                    status: 'active',
                    startedAt: new Date(),
                },
                include: {
                    challenge: true,
                },
            })

            return newUserChallenge
        })

        return NextResponse.json({
            success: true,
            newUserChallenge: {
                id: result.id,
                status: result.status,
                startedAt: result.startedAt,
                challenge: {
                    id: result.challenge.id,
                    title: result.challenge.title,
                    description: result.challenge.description,
                    co2Impact: result.challenge.co2Impact,
                },
            },
        })
    } catch (error) {
        console.error('Erreur changement défi:', error)
        return NextResponse.json(
            { error: 'Erreur lors du changement de défi' },
            { status: 500 }
        )
    }
}
