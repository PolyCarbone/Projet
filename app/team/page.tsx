"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { TeamInfo } from "@/components/team-info"
import { TeamMembersList } from "@/components/team-members-list"
import { TeamInvitations } from "@/components/team-invitations"
import { CreateTeam } from "@/components/create-team"
import { InviteFriendsModal } from "@/components/invite-friends-modal"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TeamMember {
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

interface Team {
    id: string
    name: string
    description?: string
    totalCO2Saved: number
    members: Array<{
        id: string
        userId: string
        role: string
        status: string
        user: TeamMember
    }>
    isCreator: boolean
}

interface TeamInvitation {
    id: string
    team: {
        id: string
        name: string
        description?: string
        createdAt: string
        creator: {
            id: string
            name: string
            username: string
        }
        members: Array<{
            user: {
                id: string
                name: string
                username: string
            }
        }>
    }
}

export default function Team() {
    const { session, isLoading } = useAuth()
    const [team, setTeam] = useState<Team | null>(null)
    const [invitations, setInvitations] = useState<TeamInvitation[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!isLoading && session?.user?.id) {
            fetchTeamData()
            fetchInvitations()
        }
    }, [session, isLoading])

    const fetchTeamData = async () => {
        try {
            const response = await fetch("/api/team")
            if (response.ok) {
                const data = await response.json()
                setTeam(data.team)
            }
        } catch (err) {
            console.error("Failed to fetch team:", err)
            setError("Erreur lors de la récupération de l'équipe")
        } finally {
            setLoading(false)
        }
    }

    const fetchInvitations = async () => {
        try {
            const response = await fetch("/api/team/invitations")
            if (response.ok) {
                const data = await response.json()
                setInvitations(data.invitations)
            }
        } catch (err) {
            console.error("Failed to fetch invitations:", err)
        }
    }

    const handleCreateTeam = async (name: string, description: string) => {
        try {
            const response = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            })

            if (response.ok) {
                const data = await response.json()
                setTeam(data.team)
                setError("")
            } else {
                const errorData = await response.json()
                setError(errorData.error)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de la création de l'équipe"
            )
        }
    }

    const handleLeaveTeam = async () => {
        if (!team || !session?.user?.id) return

        if (!window.confirm("Êtes-vous sûr de vouloir quitter l'équipe ?")) {
            return
        }

        try {
            const response = await fetch("/api/team/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId: team.id }),
            })

            if (response.ok) {
                setTeam(null)
                setError("")
            } else {
                const errorData = await response.json()
                setError(errorData.error)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de la tentative de quitter l'équipe"
            )
        }
    }

    const handleInviteFriend = async (friendId: string) => {
        if (!team) return

        try {
            const response = await fetch("/api/team/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendId }),
            })

            if (response.ok) {
                setError("")
            } else {
                const errorData = await response.json()
                setError(errorData.error)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de l'invitation"
            )
        }
    }

    const handleAcceptInvitation = async (teamId: string) => {
        try {
            const response = await fetch("/api/team/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId }),
            })

            if (response.ok) {
                setInvitations((prev) =>
                    prev.filter((inv) => inv.team.id !== teamId)
                )
                await fetchTeamData()
                setError("")
            } else {
                const errorData = await response.json()
                setError(errorData.error)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de l'acceptation de l'invitation"
            )
        }
    }

    const handleDeclineInvitation = async (teamId: string) => {
        try {
            const response = await fetch("/api/team/decline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId }),
            })

            if (response.ok) {
                setInvitations((prev) =>
                    prev.filter((inv) => inv.team.id !== teamId)
                )
                setError("")
            } else {
                const errorData = await response.json()
                setError(errorData.error)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors du refus de l'invitation"
            )
        }
    }

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 p-4 flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto pt-4">

                {error && (
                    <Card className="p-4 mb-6 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">
                        {error}
                    </Card>
                )}

                {team ? (
                    <div>
                        <TeamInfo
                            teamName={team.name}
                            teamDescription={team.description}
                            totalCO2Saved={team.totalCO2Saved}
                            memberCount={team.members.length}
                            onLeaveTeam={handleLeaveTeam}
                            onInviteFriend={() => setInviteModalOpen(true)}
                        />

                        <InviteFriendsModal
                            isOpen={inviteModalOpen}
                            onClose={() => setInviteModalOpen(false)}
                            teamMemberIds={team.members.map((m) => m.userId)}
                            onInvite={handleInviteFriend}
                        />

                        <Tabs defaultValue="members" className="mb-8">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="members">
                                    Membres ({team.members.length})
                                </TabsTrigger>
                                <TabsTrigger value="invitations">
                                    Invitations
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="members" className="space-y-4">
                                <h2 className="text-2xl font-bold">
                                    Membres de l'équipe
                                </h2>
                                <TeamMembersList
                                    members={team.members.map((m) => m.user)}
                                    isCreator={team.isCreator}
                                />
                            </TabsContent>

                            <TabsContent value="invitations" className="space-y-4">
                                <h2 className="text-2xl font-bold">
                                    Inviter des amis
                                </h2>
                                <button
                                    onClick={() => setInviteModalOpen(true)}
                                    className="hover:underline"
                                >
                                    Ajouter des amis
                                </button>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <Tabs defaultValue="create" className="mb-8">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="create">Créer</TabsTrigger>
                            <TabsTrigger value="invitations">
                                Invitations ({invitations.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="create" className="space-y-4">
                            <CreateTeam onCreateTeam={handleCreateTeam} />
                        </TabsContent>

                        <TabsContent value="invitations" className="space-y-4">
                            <TeamInvitations
                                invitations={invitations}
                                onAccept={handleAcceptInvitation}
                                onDecline={handleDeclineInvitation}
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    )
}