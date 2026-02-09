"use client"

import { useState, useEffect } from "react"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface Friend {
    id: string
    name: string
    username: string
    avatarId: string | null
    avatar?: {
        id: string
        name: string
        imageUrl: string
    } | null
    avatarBorderColor: string | null
    totalCO2Saved: number
}

interface InviteFriendsProps {
    teamMemberIds: string[]
    onInvite: (friendId: string) => Promise<void>
}

export function InviteFriends({ teamMemberIds, onInvite }: InviteFriendsProps) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchFriends()
    }, [])

    const fetchFriends = async () => {
        try {
            const response = await fetch("/api/friends?status=accepted")
            if (response.ok) {
                const data = await response.json()
                setFriends(data.map((f: any) => f.friend))
            }
        } catch (error) {
            console.error("Failed to fetch friends:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (friendId: string) => {
        setInviting((prev) => new Set(prev).add(friendId))
        try {
            await onInvite(friendId)
            setFriends((prev) => prev.filter((f) => f.id !== friendId))
        } finally {
            setInviting((prev) => {
                const next = new Set(prev)
                next.delete(friendId)
                return next
            })
        }
    }

    if (loading) {
        return <div className="text-center py-8">Chargement des amis...</div>
    }

    if (friends.length === 0) {
        return (
            <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                    Vous n'avez pas d'amis à inviter
                </p>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {friends.map((friend) => {
                const isTeamMember = teamMemberIds.includes(friend.id)
                const isInviting = inviting.has(friend.id)

                return (
                    <Card key={friend.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <UserAvatar
                            avatar={friend.avatar}
                            avatarBorderColor={friend.avatarBorderColor}
                            username={friend.username || friend.name}
                            userId={friend.id}
                            size="md"
                            clickable={true}
                            isCurrentUser={false}
                        />
                            <div>
                                <p className="font-medium">{friend.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    @{friend.username}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isTeamMember && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                    Membre
                                </Badge>
                            )}
                            {!isTeamMember && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => handleInvite(friend.id)}
                                    disabled={isInviting}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
