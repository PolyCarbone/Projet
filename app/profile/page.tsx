"use client"

import { useEffect, useState } from "react"
import { ProfileHeaderCard } from "@/components/profile-header-card"
import { CarbonFootprintPieChart } from "@/components/carbon-footprint-pie-chart"
import { CarbonFootprintBarChart } from "@/components/carbon-footprint-bar-chart"
import { CarbonSavingsLineChart } from "@/components/carbon-savings-line-chart"
import { UserStatsCards } from "@/components/user-stats-cards"
import { useAuth } from "@/lib/auth-context"
import { useUserProfile } from "@/lib/user-profile-context"
import { Skeleton } from "@/components/ui/skeleton"

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

interface UserStats {
    completedChallenges: number
    currentStreak: number
    friendsCount: number
}

export default function ProfilePage() {
    const { session, isLoading: isAuthLoading } = useAuth()
    const { profile, isLoading: isProfileLoading } = useUserProfile()
    const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintData | null>(null)
    const [carbonSavingsTimeline, setCarbonSavingsTimeline] = useState<CarbonSavingsData[] | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [isLoadingFootprint, setIsLoadingFootprint] = useState(true)
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(true)
    const [isLoadingStats, setIsLoadingStats] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) {
                setIsLoadingFootprint(false)
                return
            }

            try {
                const [footprintResponse, timelineResponse, statsResponse] = await Promise.all([
                    fetch("/api/carbon-footprint"),
                    fetch("/api/carbon-savings-timeline"),
                    fetch("/api/user-stats")
                ])

                if (footprintResponse.ok) {
                    const footprintData = await footprintResponse.json()
                    setCarbonFootprint(footprintData)
                }

                if (timelineResponse.ok) {
                    const timelineData = await timelineResponse.json()
                    setCarbonSavingsTimeline(timelineData)
                }

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    setUserStats(statsData)
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setIsLoadingFootprint(false)
                setIsLoadingTimeline(false)
                setIsLoadingStats(false)
            }
        }

        if (!isAuthLoading) {
            fetchData()
        }
    }, [session, isAuthLoading])

    const isLoading = isAuthLoading || isProfileLoading || isLoadingFootprint || isLoadingTimeline || isLoadingStats

    return (
        <div className="relative min-h-screen">

            <div className="relative">

                {/* Profile Content */}
                <div className="w-full">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <Skeleton className="h-28 w-28 rounded-full" />
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    ) : session?.user && profile ? (
                        <>
                            <div className="px-4 pt-8 pb-4 max-w-7xl mx-auto">
                                <ProfileHeaderCard
                                    user={{
                                        username: profile.username || "utilisateur",
                                        email: profile.email,
                                        createdAt: profile.createdAt,
                                        avatar: profile.avatar,
                                        avatarBorderColor: profile.avatarBorderColor,
                                        userId: session.user.id,
                                    }}
                                    isCurrentUser={true}
                                />
                            </div>
                            <div className="px-4 pb-4 max-w-7xl mx-auto">
                                <CarbonSavingsLineChart
                                    data={carbonSavingsTimeline}
                                    isLoading={isLoadingTimeline}
                                />
                            </div>
                            <div className="px-4 pb-4 max-w-7xl mx-auto">
                                <UserStatsCards
                                    stats={userStats}
                                    isLoading={isLoadingStats}
                                />
                            </div>
                            <div className="px-4 pb-8 max-w-7xl mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <CarbonFootprintPieChart data={carbonFootprint} />
                                    <CarbonFootprintBarChart data={carbonFootprint} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">Vous devez être connecté pour voir votre profil.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}
