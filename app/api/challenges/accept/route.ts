import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/challenges/accept
 * Accepte un défi et le marque comme actif pour l'utilisateur
 * Body: { challengeId: string }
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
        const { challengeId } = body

        if (!challengeId) {
            return NextResponse.json(
                { error: 'ID du défi requis' },
                { status: 400 }
            )
        }

        // Vérifier que le défi existe
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
        })

        if (!challenge) {
            return NextResponse.json(
                { error: 'Défi introuvable' },
                { status: 404 }
            )
        }

        if (!challenge.isActive) {
            return NextResponse.json(
                { error: 'Défi non actif' },
                { status: 400 }
            )
        }

        // Vérifier si l'utilisateur a déjà ce défi actif
        const existingActiveChallenge = await prisma.userChallenge.findFirst({
            where: {
                userId: session.user.id,
                challengeId: challengeId,
                status: 'active',
            },
        })

        if (existingActiveChallenge) {
            return NextResponse.json(
                { error: 'Défi déjà actif' },
                { status: 400 }
            )
        }

        // Créer ou mettre à jour le UserChallenge
        const userChallenge = await prisma.userChallenge.create({
            data: {
                userId: session.user.id,
                challengeId: challengeId,
                status: 'active',
                startedAt: new Date(),
            },
            include: {
                challenge: true,
            },
        })

        return NextResponse.json({
            success: true,
            userChallenge: {
                id: userChallenge.id,
                status: userChallenge.status,
                startedAt: userChallenge.startedAt,
                challenge: {
                    id: userChallenge.challenge.id,
                    title: userChallenge.challenge.title,
                    co2Impact: userChallenge.challenge.co2Impact,
                },
            },
        })
    } catch (error) {
        console.error('Erreur acceptation défi:', error)
        return NextResponse.json(
            { error: 'Erreur lors de l\'acceptation du défi' },
            { status: 500 }
        )
    }
}
