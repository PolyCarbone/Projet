"use client"

import { useEffect, useState } from "react"
import { Navbar1 } from "@/components/home-navbar"
import { ProfileHeader } from "@/components/profile-header"
import { CarbonFootprintPieChart } from "@/components/carbon-footprint-pie-chart"
import { CarbonFootprintBarChart } from "@/components/carbon-footprint-bar-chart"
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

export default function ProfilePage() {
    const { session, isLoading: isAuthLoading } = useAuth()
    const { profile, isLoading: isProfileLoading } = useUserProfile()
    const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintData | null>(null)
    const [isLoadingFootprint, setIsLoadingFootprint] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) {
                setIsLoadingFootprint(false)
                return
            }

            try {
                const footprintResponse = await fetch("/api/carbon-footprint")
                if (footprintResponse.ok) {
                    const footprintData = await footprintResponse.json()
                    setCarbonFootprint(footprintData)
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setIsLoadingFootprint(false)
            }
        }

        if (!isAuthLoading) {
            fetchData()
        }
    }, [session, isAuthLoading])

    const handleUpdateName = async (newName: string) => {
        // TODO: Implement name update via API
        console.log("Update name to:", newName)
    }

    const isLoading = isAuthLoading || isProfileLoading || isLoadingFootprint

    return (
        <div className="relative min-h-screen">
            {/* Background Image */}
            <div
                className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat brightness-75 dark:brightness-50"
                style={{
                    backgroundImage: "url('/images/app-background.jpg')",
                }}
            />

            {/* Frosted Glass Overlay */}
            <div className="fixed inset-0 -z-10 backdrop-blur-md dark:bg-black/30" />

            <div className="relative">
                <div className="backdrop-blur-xl bg-white dark:bg-black border-b border-zinc-200/50 dark:border-zinc-800 shadow-lg dark:shadow-black/50">
                    <Navbar1 />
                </div>

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
                            <ProfileHeader
                                user={{
                                    name: profile.name,
                                    email: profile.email,
                                    username: profile.username || "utilisateur",
                                    createdAt: profile.createdAt,
                                    avatar: profile.avatar,
                                    avatarBorderColor: profile.avatarBorderColor,
                                }}
                                isOwnProfile={true}
                                onUpdateName={handleUpdateName}
                            />
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
