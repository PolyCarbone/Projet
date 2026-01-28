"use client"

import { Trophy, Flame, Users } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface UserStatsCardsProps {
    stats: {
        completedChallenges: number
        currentStreak: number
        friendsCount: number
    } | null
    isLoading?: boolean
}

export function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
    if (isLoading || !stats) {
        return (
            <Card className="border-none shadow-none">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="h-24 bg-muted animate-pulse rounded-lg" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-24 bg-muted animate-pulse rounded-lg" />
                            <div className="h-24 bg-muted animate-pulse rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-none">
            <CardContent className="p-0">
                <div className="flex flex-col gap-4">
                    {/* Card Défis - Prend toute la largeur */}
                    <Link href="/challenges">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="px-6 py-1">
                                <div className="flex items-center justify-center gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <Trophy className="h-8 w-8 text-yellow-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Défis réalisés</p>
                                        <p className="text-3xl font-bold text-foreground">
                                            {stats.completedChallenges}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Cards Streak et Amis - Côte à côte */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Card Streak */}
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="px-2 py-1 md:px-4 md:py-3 h-full flex items-center justify-center">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-red-100 flex items-center justify-center">
                                            <Flame className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] md:text-xs text-muted-foreground">Streak</p>
                                        <p className="text-sm md:text-xl font-bold text-foreground">
                                            {stats.currentStreak} {stats.currentStreak > 1 ? 'jours' : 'jour'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card Amis */}
                        <Link href="/social">
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                <CardContent className="px-2 py-1 md:px-4 md:py-3 h-full flex items-center justify-center">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Users className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] md:text-xs text-muted-foreground">Amis</p>
                                            <p className="text-sm md:text-xl font-bold text-foreground">
                                                {stats.friendsCount} {stats.friendsCount > 1 ? 'amis' : 'ami'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
