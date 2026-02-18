"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProfileHeaderCard } from "@/components/profile-header-card"
import { UserStatsCards } from "@/components/user-stats-cards"
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
    totalCO2Saved: number
}

interface UserStats {
    completedChallenges: number
    currentStreak: number
    friendsCount: number
}

export default function PublicProfilePage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string
    const { session, isLoading: isAuthLoading } = useAuth()

    const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [isLoadingStats, setIsLoadingStats] = useState(true)
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
                return
            }

            try {
                const [profileResponse, statsResponse] = await Promise.all([
                    fetch(`/api/users/${userId}/profile`),
                    fetch(`/api/users/${userId}/stats`),
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
            } catch (err) {
                console.error("Failed to fetch user data:", err)
                setError("Erreur lors du chargement du profil")
            } finally {
                setIsLoadingProfile(false)
                setIsLoadingStats(false)
            }
        }

        if (!isAuthLoading) {
            fetchData()
        }
    }, [session, isAuthLoading, userId])

    const isLoading = isAuthLoading || isLoadingProfile || isLoadingStats

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
                        <div className="p-8 space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <Skeleton className="h-28 w-28 rounded-full" />
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-48" />
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
