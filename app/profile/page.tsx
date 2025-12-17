"use client"

import { useEffect, useState } from "react"
import { Navbar1 } from "@/components/home-navbar"
import { ProfileHeader } from "@/components/profile-header"
import { CarbonFootprintPieChart } from "@/components/carbon-footprint-pie-chart"
import { CarbonFootprintBarChart } from "@/components/carbon-footprint-bar-chart"
import { authClient } from "@/lib/auth-client"
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
    const [session, setSession] = useState<any>(null)
    const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await authClient.getSession()
                setSession(data)

                // Récupérer les données d'empreinte carbone si l'utilisateur est connecté
                if (data?.user) {
                    const response = await fetch("/api/carbon-footprint")
                    if (response.ok) {
                        const footprintData = await response.json()
                        setCarbonFootprint(footprintData)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleUpdateName = async (newName: string) => {
        // TODO: Implement name update via API
        console.log("Update name to:", newName)
    }

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
                {/* Navbar with frosted glass effect */}
                <div className="backdrop-blur-xl bg-white dark:bg-black border-b border-zinc-200/50 dark:border-zinc-800 shadow-lg dark:shadow-black/50">
                    <Navbar1
                        auth={{
                            login: { title: "Connexion", url: "/auth/portal?mode=login" },
                            signup: { title: "Inscription", url: "/auth/portal?mode=signup" },
                        }}
                    />
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
                    ) : session?.user ? (
                        <>
                            <ProfileHeader
                                user={{
                                    name: session.user.name || "Utilisateur",
                                    email: session.user.email,
                                    image: session.user.image,
                                    createdAt: session.user.createdAt,
                                    username: session.user.username || "utilisateur",
                                    avatarColor: session.user.avatarColor,
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
        </div>
    )
}