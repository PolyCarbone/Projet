"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProfileHeaderCard } from "@/components/profile-header-card"
import { UserStatsCards } from "@/components/user-stats-cards"
import { CarbonSavingsLineChart } from "@/components/carbon-savings-line-chart"
import { CarbonFootprintPieChart } from "@/components/carbon-footprint-pie-chart"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PublicUserProfile {
    id: string
    name: string
    username: string | null
    createdAt: string
    avatar?: {
        id: string
        name: string
        imageUrl: string
    } | null
    avatarBorderColor?: string | null
    usernameColor?: string | null
    banner?: {
        id: string
        name: string
        imageUrl: string | null
        colorValue?: string | null
    } | null
    totalCO2Saved: number
}

interface UserStats {
    completedChallenges: number
    currentStreak: number
    friendsCount: number
}

interface CarbonFootprintData {
    transport?: number | null
    alimentation?: number | null
    logement?: number | null
    serviceSocietal?: number | null
    divers?: number | null
    totalFootprint?: number
}

interface CarbonSavingsData {
    date: string
    cumulativeCO2Saved: number
}

export default function PublicProfilePage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string
    const { session, isLoading: isAuthLoading } = useAuth()

    const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintData | null>(null)
    const [carbonSavingsTimeline, setCarbonSavingsTimeline] = useState<CarbonSavingsData[] | null>(null)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [isLoadingStats, setIsLoadingStats] = useState(true)
    const [isLoadingFootprint, setIsLoadingFootprint] = useState(true)
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Redirect to own profile if viewing self
    useEffect(() => {
        if (!isAuthLoading && session?.user?.id === userId) {
            router.replace("/profile")
        }
    }, [isAuthLoading, session, userId, router])

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user || !userId) {
                setIsLoadingProfile(false)
                setIsLoadingStats(false)
                setIsLoadingFootprint(false)
                setIsLoadingTimeline(false)
                return
            }

            try {
                const [profileResponse, statsResponse, footprintResponse, timelineResponse] = await Promise.all([
                    fetch(`/api/users/${userId}/profile`),
                    fetch(`/api/users/${userId}/stats`),
                    fetch(`/api/users/${userId}/carbon-footprint`),
                    fetch(`/api/users/${userId}/carbon-savings-timeline`),
                ])

                if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    setUserProfile(profileData)
                } else if (profileResponse.status === 404) {
                    setError("Utilisateur non trouvé")
                } else {
                    setError("Erreur lors du chargement du profil")
                }

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    setUserStats(statsData)
                }

                if (footprintResponse.ok) {
                    const footprintData = await footprintResponse.json()
                    setCarbonFootprint(footprintData)
                }

                if (timelineResponse.ok) {
                    const timelineData = await timelineResponse.json()
                    setCarbonSavingsTimeline(timelineData)
                }
            } catch (err) {
                console.error("Failed to fetch user data:", err)
                setError("Erreur lors du chargement du profil")
            } finally {
                setIsLoadingProfile(false)
                setIsLoadingStats(false)
                setIsLoadingFootprint(false)
                setIsLoadingTimeline(false)
            }
        }

        if (!isAuthLoading) {
            fetchData()
        }
    }, [session, isAuthLoading, userId])

    const isLoading = isAuthLoading || isLoadingProfile || isLoadingStats

    const displayName = userProfile?.username || "cet utilisateur"

    return (
        <div className="relative min-h-screen">
            <div className="relative">
                <div className="w-full">
                    {/* Bouton retour */}
                    <div className="px-4 pt-4 max-w-7xl mx-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <Skeleton className="h-28 w-28 rounded-full" />
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="grid grid-cols-3 gap-4 max-w-7xl mx-auto px-4">
                                <Skeleton className="h-24 rounded-xl" />
                                <Skeleton className="h-24 rounded-xl" />
                                <Skeleton className="h-24 rounded-xl" />
                            </div>
                            <div className="px-4 max-w-7xl mx-auto">
                                <Skeleton className="h-64 rounded-xl" />
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                    ) : userProfile ? (
                        <>
                            <div className="px-4 pt-4 pb-4 max-w-7xl mx-auto">
                                <ProfileHeaderCard
                                    user={{
                                        username: userProfile.username || "utilisateur",
                                        createdAt: userProfile.createdAt,
                                        avatar: userProfile.avatar,
                                        avatarBorderColor: userProfile.avatarBorderColor,
                                        usernameColor: userProfile.usernameColor,
                                        banner: userProfile.banner,
                                        userId: userProfile.id,
                                    }}
                                    isCurrentUser={false}
                                />
                            </div>
                            <div className="px-4 pb-4 max-w-7xl mx-auto">
                                <UserStatsCards
                                    stats={userStats}
                                    isLoading={isLoadingStats}
                                />
                            </div>
                            <div className="">
                                <CarbonSavingsLineChart
                                    data={carbonSavingsTimeline}
                                    isLoading={isLoadingTimeline}
                                    title={`Progression de ${displayName}`}
                                    description={`Depuis le premier défi réalisé par ${displayName}`}
                                />
                            </div>
                            {carbonFootprint && (
                                <div className="px-4 pb-4 max-w-7xl mx-auto">
                                    <CarbonFootprintPieChart data={carbonFootprint} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">Profil introuvable.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}