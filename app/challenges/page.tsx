"use client"

import { useState, useEffect } from "react"
import { ChallengeCard } from "@/components/challenge-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Trophy, Dices, Loader2, Calendar, CheckCircle2, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Challenge {
    id: string
    title: string
    description: string
    category: string
    type: string
    co2Impact: number
    event?: {
        id: string
        name: string
        startDate: Date
        endDate: Date
    } | null
    userStatus?: {
        id: string
        status: string
        startedAt: Date
        completedAt?: Date | null
        co2Saved?: number | null
        wasChanged: boolean
    } | null
}

const DAILY_COUNT = 3
const SHOW_MORE_STEP = 2

export default function ChallengesPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(true)
    const [rerollingId, setRerollingId] = useState<string | null>(null)
    const [showCompleted, setShowCompleted] = useState(false)
    const [visibleEventCount, setVisibleEventCount] = useState(SHOW_MORE_STEP)
    const [visibleAnnualCount, setVisibleAnnualCount] = useState(SHOW_MORE_STEP)

    useEffect(() => {
        loadChallenges()
    }, [])

    /**
     * Sélectionne les défis quotidiens en priorisant les 2 catégories les plus
     * impactantes de l'empreinte carbone de l'utilisateur :
     *   - 2 défis pour la catégorie n°1
     *   - 1 défi pour la catégorie n°2
     * Si une catégorie n'a pas assez de défis disponibles, on complète
     * aléatoirement avec les défis restants.
     */
    const pickPrioritizedDailies = (
        available: Challenge[],
        needed: number,
        topCategories: string[]
    ): Challenge[] => {
        if (topCategories.length === 0) {
            // Pas de données d'empreinte : sélection aléatoire
            return available.sort(() => Math.random() - 0.5).slice(0, needed)
        }

        const picked: Challenge[] = []
        const remaining = [...available]

        // Quotas : 2 pour la 1re catégorie, 1 pour la 2e
        const quotas = [
            { category: topCategories[0], count: Math.min(2, needed) },
            ...(topCategories.length > 1 ? [{ category: topCategories[1], count: Math.min(1, needed - Math.min(2, needed)) }] : []),
        ]

        for (const { category, count } of quotas) {
            if (picked.length >= needed) break
            const catChallenges = remaining
                .filter(c => c.category === category)
                .sort(() => Math.random() - 0.5)
            const take = catChallenges.slice(0, count)
            picked.push(...take)
            // Retirer les défis sélectionnés du pool
            for (const t of take) {
                const idx = remaining.findIndex(c => c.id === t.id)
                if (idx !== -1) remaining.splice(idx, 1)
            }
        }

        // Compléter avec des défis aléatoires si besoin
        if (picked.length < needed) {
            const filler = remaining.sort(() => Math.random() - 0.5).slice(0, needed - picked.length)
            picked.push(...filler)
        }

        return picked
    }

    const loadChallenges = async () => {
        try {
            setLoading(true)

            // Charger en parallèle les défis et l'empreinte carbone
            const [challengeRes, footprintRes] = await Promise.all([
                fetch('/api/challenges'),
                fetch('/api/carbon-footprint'),
            ])

            if (!challengeRes.ok) throw new Error('Erreur de chargement')

            const data = await challengeRes.json()
            const all: Challenge[] = data.challenges

            // Extraire les 2 catégories les plus impactantes
            let topCategories: string[] = []
            if (footprintRes.ok) {
                const fp = await footprintRes.json()
                const categoryMap: Record<string, string> = {
                    transport: 'transport',
                    alimentation: 'alimentation',
                    logement: 'logement',
                    divers: 'divers',
                    serviceSocietal: 'serviceSocietal',
                }
                const entries = Object.entries(categoryMap)
                    .map(([key, cat]) => ({ cat, value: (fp[key] as number) ?? 0 }))
                    .filter(e => e.value > 0)
                    .sort((a, b) => b.value - a.value)
                topCategories = entries.slice(0, 2).map(e => e.cat)
            }

            // Auto-accepter des défis quotidiens si pas encore 3 actifs
            const activeDailies = all.filter(c => c.type === 'daily' && c.userStatus?.status === 'active')
            const needed = DAILY_COUNT - activeDailies.length
            if (needed > 0) {
                const available = all.filter(c => c.type === 'daily' && (!c.userStatus || c.userStatus.status === 'skipped' || c.userStatus.status === 'changed'))
                const selected = pickPrioritizedDailies(available, needed, topCategories)
                for (const c of selected) {
                    await fetch('/api/challenges/accept', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ challengeId: c.id }),
                    })
                }
                const refreshed = await fetch('/api/challenges')
                const refreshedData = await refreshed.json()
                setChallenges(refreshedData.challenges)
            } else {
                setChallenges(all)
            }
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors du chargement des défis')
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = async (userChallengeId: string) => {
        try {
            const response = await fetch('/api/challenges/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userChallengeId }),
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur')
            }
            const data = await response.json()
            toast.success(`Défi complété ! +${data.totalCO2Saved} kg CO₂ économisés 🎉`)
            loadChallenges()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la complétion du défi')
        }
    }

    /** Accept then complete in one step (for event/annual challenges not yet accepted) */
    const handleAcceptAndComplete = async (challenge: Challenge) => {
        try {
            let userChallengeId: string

            if (challenge.userStatus?.status === 'active') {
                userChallengeId = challenge.userStatus.id
            } else {
                // First accept the challenge
                const acceptResponse = await fetch('/api/challenges/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ challengeId: challenge.id }),
                })
                if (!acceptResponse.ok) {
                    const error = await acceptResponse.json()
                    throw new Error(error.error || 'Erreur')
                }
                const acceptData = await acceptResponse.json()
                userChallengeId = acceptData.userChallenge.id
            }

            // Then complete
            const response = await fetch('/api/challenges/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userChallengeId }),
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur')
            }
            const data = await response.json()
            toast.success(`Défi complété ! +${data.totalCO2Saved} kg CO₂ économisés 🎉`)
            loadChallenges()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la complétion du défi')
        }
    }

    const handleReroll = async (userChallengeId: string) => {
        try {
            setRerollingId(userChallengeId)
            const response = await fetch('/api/challenges/reroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userChallengeId }),
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur')
            }
            const data = await response.json()
            if (data.newUserChallenges?.length > 0) {
                toast.success(`Nouveau défi : ${data.newUserChallenges[0].challenge.title}`)
            }
            loadChallenges()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors du re-roll')
        } finally {
            setRerollingId(null)
        }
    }

    // Daily (active only)
    const dailyChallenges = challenges.filter(c => c.type === 'daily' && c.userStatus?.status === 'active')

    // Events & Annual: exclude completed from the choice list
    const availableEventChallenges = challenges.filter(c =>
        c.type === 'event' && c.userStatus?.status !== 'completed'
    )
    const availableAnnualChallenges = challenges.filter(c =>
        c.type === 'annual' && c.userStatus?.status !== 'completed'
    )

    // All completed
    const allCompleted = challenges.filter(c => c.userStatus?.status === 'completed')

    // Visible slices
    const visibleEvents = availableEventChallenges.slice(0, visibleEventCount)
    const visibleAnnuals = availableAnnualChallenges.slice(0, visibleAnnualCount)

    return (
        <div className="mt-4 space-y-8">

            {/* Défis du jour */}
            <section>
                <div className="flex items-center justify-between mb-3 px-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Dices className="size-4" />
                        Défis du jour
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
                        {[...Array(DAILY_COUNT)].map((_, i) => <Skeleton key={i} className="h-36" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
                        {dailyChallenges.map((challenge) => (
                            <div key={challenge.id} className="relative">
                                {rerollingId === challenge.userStatus?.id && (
                                    <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center z-10">
                                        <Loader2 className="size-5 animate-spin" />
                                    </div>
                                )}
                                <ChallengeCard
                                    challenge={challenge}
                                    onComplete={() => handleComplete(challenge.userStatus!.id)}
                                    onReroll={() => handleReroll(challenge.userStatus!.id)}
                                />
                            </div>
                        ))}
                        {dailyChallenges.length < DAILY_COUNT && (
                            Array.from({ length: DAILY_COUNT - dailyChallenges.length }).map((_, i) => (
                                <Skeleton key={`placeholder-${i}`} className="h-36 opacity-40" />
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* Défis d'événement */}
            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 px-4">
                    <Calendar className="size-4" />
                    Défis d&apos;événement
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-36" />)}
                    </div>
                ) : availableEventChallenges.length === 0 ? (
                    <Card className="mx-4">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Calendar className="size-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-center text-xs">Aucun événement en cours.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                            {visibleEvents.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    onComplete={() => handleAcceptAndComplete(challenge)}
                                />
                            ))}
                        </div>
                        {visibleEventCount < availableEventChallenges.length && (
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs gap-1"
                                    onClick={() => setVisibleEventCount(prev => prev + SHOW_MORE_STEP)}
                                >
                                    <ChevronDown className="size-3" />
                                    Afficher plus
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Défis annuels */}
            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 px-4">
                    <Trophy className="size-4" />
                    Défis annuels
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-36" />)}
                    </div>
                ) : availableAnnualChallenges.length === 0 ? (
                    <Card className="mx-4">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Trophy className="size-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-center text-xs">Tous les défis annuels ont été complétés !</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                            {visibleAnnuals.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    onComplete={() => handleAcceptAndComplete(challenge)}
                                />
                            ))}
                        </div>
                        {visibleAnnualCount < availableAnnualChallenges.length && (
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs gap-1"
                                    onClick={() => setVisibleAnnualCount(prev => prev + SHOW_MORE_STEP)}
                                >
                                    <ChevronDown className="size-3" />
                                    Afficher plus
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Bouton défis complétés */}
            {allCompleted.length > 0 && (
                <div className="flex justify-center pb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={() => setShowCompleted(true)}
                    >
                        <CheckCircle2 className="size-3 text-green-600" />
                        Voir les défis complétés ({allCompleted.length})
                    </Button>
                </div>
            )}

            {/* Modal défis complétés */}
            {showCompleted && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowCompleted(false)}
                >
                    <div
                        className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-green-600" />
                                Défis complétés ({allCompleted.length})
                            </h2>
                            <button
                                onClick={() => setShowCompleted(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {allCompleted.map((challenge) => (
                                    <ChallengeCard key={challenge.id} challenge={challenge} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
