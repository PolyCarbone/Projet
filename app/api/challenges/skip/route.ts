import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/challenges/skip
 * Passe un défi (le marque comme skipped)
 * Body: { userChallengeId: string }
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

        // Mettre à jour le statut
        const updated = await prisma.userChallenge.update({
            where: { id: userChallengeId },
            data: {
                status: 'skipped',
            },
            include: {
                challenge: true,
            },
        })

        return NextResponse.json({
            success: true,
            userChallenge: {
                id: updated.id,
                status: updated.status,
                challenge: {
                    id: updated.challenge.id,
                    title: updated.challenge.title,
                },
            },
        })
    } catch (error) {
        console.error('Erreur skip défi:', error)
        return NextResponse.json(
            { error: 'Erreur lors du passage du défi' },
            { status: 500 }
        )
    }
}
