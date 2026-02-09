import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/challenges
 * Récupère les défis disponibles avec leurs statuts pour l'utilisateur connecté
 * Query params:
 *   - type: daily | annual | event
 *   - category: transport | alimentation | logement | divers | serviceSocietal
 *   - status: proposed | active | completed | skipped
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type')
        const category = searchParams.get('category')
        const status = searchParams.get('status')

        // Construire les filtres
        const challengeFilters: any = {
            isActive: true,
        }

        if (type) {
            challengeFilters.type = type
        }

        if (category) {
            challengeFilters.category = category
        }

        // Récupérer tous les défis actifs
        const challenges = await prisma.challenge.findMany({
            where: challengeFilters,
            include: {
                event: true,
                userChallenges: {
                    where: {
                        userId: session.user.id,
                    },
                    orderBy: {
                        startedAt: 'desc',
                    },
                    take: 1, // Prendre le plus récent
                },
            },
            orderBy: [
                { type: 'asc' },
                { category: 'asc' },
                { title: 'asc' },
            ],
        })

        // Transformer les données pour inclure le statut utilisateur
        const challengesWithStatus = challenges.map((challenge) => {
            const userChallenge = challenge.userChallenges[0]

            return {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                category: challenge.category,
                type: challenge.type,
                co2Impact: challenge.co2Impact,
                event: challenge.event ? {
                    id: challenge.event.id,
                    name: challenge.event.name,
                    startDate: challenge.event.startDate,
                    endDate: challenge.event.endDate,
                } : null,
                userStatus: userChallenge ? {
                    id: userChallenge.id,
                    status: userChallenge.status,
                    startedAt: userChallenge.startedAt,
                    completedAt: userChallenge.completedAt,
                    co2Saved: userChallenge.co2Saved,
                    wasChanged: userChallenge.wasChanged,
                } : null,
            }
        })

        // Filtrer par statut si demandé
        let filteredChallenges = challengesWithStatus
        if (status) {
            filteredChallenges = challengesWithStatus.filter((c) => {
                if (status === 'available') {
                    return !c.userStatus || c.userStatus.status === 'skipped'
                }
                return c.userStatus?.status === status
            })
        }

        return NextResponse.json({
            challenges: filteredChallenges,
            total: filteredChallenges.length,
        })
    } catch (error) {
        console.error('Erreur récupération défis:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des défis' },
            { status: 500 }
        )
    }
}
