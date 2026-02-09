"use client"

import { useState, useEffect } from "react"
import { ChallengeCard } from "@/components/challenge-card"
import { ChallengeFilters } from "@/components/challenge-filters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Leaf, Trophy, TrendingUp, Target } from "lucide-react"

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

export default function ChallengesPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        totalCO2Saved: 0,
    })

    useEffect(() => {
        loadChallenges()
    }, [selectedType, selectedCategory, selectedStatus])

    const loadChallenges = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (selectedType) params.append('type', selectedType)
            if (selectedCategory) params.append('category', selectedCategory)
            if (selectedStatus) params.append('status', selectedStatus)

            const response = await fetch(`/api/challenges?${params}`)
            if (!response.ok) throw new Error('Erreur de chargement')

            const data = await response.json()
            setChallenges(data.challenges)

            // Calculer les stats
            const active = data.challenges.filter((c: Challenge) => c.userStatus?.status === 'active').length
            const completed = data.challenges.filter((c: Challenge) => c.userStatus?.status === 'completed').length
            const totalCO2 = data.challenges
                .filter((c: Challenge) => c.userStatus?.status === 'completed')
                .reduce((sum: number, c: Challenge) => sum + (c.userStatus?.co2Saved || 0), 0)

            setStats({ active, completed, totalCO2Saved: totalCO2 })
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors du chargement des défis')
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (challengeId: string) => {
        try {
            const response = await fetch('/api/challenges/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeId }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur')
            }

            toast.success('Défi accepté !')
            loadChallenges()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'acceptation du défi')
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

    const handleSkip = async (userChallengeId: string) => {
        try {
            const response = await fetch('/api/challenges/skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userChallengeId }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur')
            }

            toast.success('Défi passé')
            loadChallenges()
        } catch (error: any) {
            toast.error(error.message || 'Erreur')
        }
    }

    const handleChange = async (currentUserChallengeId: string) => {
        // Pour l'instant, simple skip - à améliorer avec une modale de sélection
        try {
            const availableChallenges = challenges.filter(
                c => !c.userStatus || c.userStatus.status === 'skipped'
            )

            if (availableChallenges.length === 0) {
                toast.error('Aucun défi disponible pour le changement')
                return
            }

            const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)]

            const response = await fetch('/api/challenges/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentUserChallengeId,
                    newChallengeId: randomChallenge.id,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur')
            }

            const data = await response.json()
            toast.success(`Nouveau défi : ${data.newUserChallenge.challenge.title}`)
            loadChallenges()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors du changement de défi')
        }
    }

    const activeChallenges = challenges.filter(c => c.userStatus?.status === 'active')
    const availableChallenges = challenges.filter(c => !c.userStatus || c.userStatus.status === 'skipped')
    const completedChallenges = challenges.filter(c => c.userStatus?.status === 'completed')

    return (
        <div className="relative min-h-screen pb-20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Défis Écologiques</h1>
                    <p className="text-muted-foreground">
                        Relevez des défis quotidiens, annuels ou événementiels pour réduire votre empreinte carbone
                    </p>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Défis en cours</CardTitle>
                            <Target className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Défis complétés</CardTitle>
                            <Trophy className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">CO₂ économisé</CardTitle>
                            <Leaf className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.totalCO2Saved.toFixed(1)} kg
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Filtres</CardTitle>
                        <CardDescription>Filtrez les défis par type, catégorie ou statut</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChallengeFilters
                            selectedType={selectedType}
                            selectedCategory={selectedCategory}
                            selectedStatus={selectedStatus}
                            onTypeChange={setSelectedType}
                            onCategoryChange={setSelectedCategory}
                            onStatusChange={setSelectedStatus}
                        />
                    </CardContent>
                </Card>

                {/* Liste des défis */}
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="active">En cours ({activeChallenges.length})</TabsTrigger>
                        <TabsTrigger value="available">Disponibles ({availableChallenges.length})</TabsTrigger>
                        <TabsTrigger value="completed">Complétés ({completedChallenges.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-64" />
                                ))}
                            </div>
                        ) : activeChallenges.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Target className="size-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-center">
                                        Aucun défi en cours. Commencez par accepter un défi !
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeChallenges.map((challenge) => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onComplete={() => handleComplete(challenge.userStatus!.id)}
                                        onSkip={() => handleSkip(challenge.userStatus!.id)}
                                        onChange={() => handleChange(challenge.userStatus!.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="available" className="mt-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-64" />
                                ))}
                            </div>
                        ) : availableChallenges.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <TrendingUp className="size-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-center">
                                        Tous les défis ont été acceptés ou complétés !
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableChallenges.map((challenge) => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onAccept={() => handleAccept(challenge.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-64" />
                                ))}
                            </div>
                        ) : completedChallenges.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Trophy className="size-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-center">
                                        Aucun défi complété pour le moment. Relevez votre premier défi !
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completedChallenges.map((challenge) => (
                                    <ChallengeCard key={challenge.id} challenge={challenge} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
