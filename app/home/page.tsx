"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUserProfile } from "@/lib/user-profile-context"
import { UserAvatar } from "@/components/user-avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, Trophy, Medal, Crown, ChevronRight, Globe, Users, Flame } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  username: string | null
  avatar?: { id: string; name: string; imageUrl: string } | null
  avatarBorderColor?: string | null
  totalCO2Saved: number
  currentStreak?: number
}

export default function Home() {
  const { profile, isLoading: isProfileLoading } = useUserProfile()
  const [stats, setStats] = useState<{
    completedChallenges: number
    currentStreak: number
    friendsCount: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [friends, setFriends] = useState<LeaderboardEntry[]>([])
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [globalLoading, setGlobalLoading] = useState(true)

  useEffect(() => {
    fetchFriendsLeaderboard()
    fetchGlobalLeaderboard()
  }, [])

  const fetchFriendsLeaderboard = async () => {
    try {
      const res = await fetch("/api/friends?status=accepted")
      if (res.ok) {
        const data = await res.json()
        const leaderboard: LeaderboardEntry[] = data
          .map((f: any) => f.friend)
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.totalCO2Saved - a.totalCO2Saved)
        setFriends(leaderboard)
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err)
    } finally {
      setFriendsLoading(false)
    }
  }

  const fetchGlobalLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard")
      if (res.ok) {
        const data = await res.json()
        setGlobalLeaderboard(data)
      }
    } catch (err) {
      console.error("Failed to fetch global leaderboard:", err)
    } finally {
      setGlobalLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bonjour"
    if (hour < 18) return "Bon après-midi"
    return "Bonsoir"
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="size-5 text-yellow-500" />
    if (index === 1) return <Medal className="size-5 text-gray-400" />
    if (index === 2) return <Medal className="size-5 text-amber-600" />
    return <span className="text-sm font-semibold text-muted-foreground w-5 text-center">{index + 1}</span>
  }

  const LeaderboardList = ({
    entries,
    loading,
    emptyMessage,
  }: {
    entries: LeaderboardEntry[]
    loading: boolean
    emptyMessage: string
  }) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${index < 3 ? "bg-muted/50" : ""
              }`}
          >
            <div className="flex-shrink-0 w-6 flex justify-center">
              {getRankIcon(index)}
            </div>
            <UserAvatar
              avatar={entry.avatar}
              avatarBorderColor={entry.avatarBorderColor}
              username={entry.username}
              userId={entry.id}
              size="sm"
              clickable
            />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {entry.username}
              </p>
              {entry.currentStreak != null && entry.currentStreak > 0 && (
                <div className="flex items-center gap-0.5 text-orange-500 dark:text-orange-400 font-medium text-xs whitespace-nowrap" title="Streak">
                  <Flame className="size-3.5" /> {entry.currentStreak}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold text-sm whitespace-nowrap">
              {entry.totalCO2Saved.toFixed(1)} kg
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        {isProfileLoading ? (
          <>
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </>
        ) : (
          <>
            <UserAvatar
              avatar={profile?.avatar}
              avatarBorderColor={profile?.avatarBorderColor}
              username={profile?.username}
              size="lg"
              clickable
              isCurrentUser
            />
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {profile?.username || "Utilisateur"} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Prêt à réduire ton empreinte carbone ?
              </p>
            </div>
          </>
        )}
      </div>

      {/* CTA Daily Challenges */}
      <Link href="/challenges">
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center justify-between py-2 px-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <Sparkles className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-green-900 dark:text-green-100">
                  Découvrir mes défis quotidiens
                </h2>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Relève de nouveaux défis chaque jour !
                </p>
              </div>
            </div>
            <ChevronRight className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          </CardContent>
        </Card>
      </Link>

      <div className="flex items-center gap-2"></div>
      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends">
            <TabsList className="w-full">
              <TabsTrigger value="friends" className="flex-1 gap-1">
                <Users className="size-4" />
                Amis
              </TabsTrigger>
              <TabsTrigger value="global" className="flex-1 gap-1">
                <Globe className="size-4" />
                Mondial
              </TabsTrigger>
            </TabsList>
            <TabsContent value="friends" className="mt-4">
              <LeaderboardList
                entries={friends}
                loading={friendsLoading}
                emptyMessage="Ajoutez des amis pour voir le classement !"
              />
              {friends.length > 0 && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/social">
                      Voir tous mes amis
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="global" className="mt-4">
              <LeaderboardList
                entries={globalLeaderboard}
                loading={globalLoading}
                emptyMessage="Le classement mondial sera bientôt disponible !"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
