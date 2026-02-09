"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
            }
        }>
    }
}

interface TeamInvitationsProps {
    invitations: TeamInvitation[]
    onAccept: (teamId: string) => Promise<void>
    onDecline: (teamId: string) => Promise<void>
}

export function TeamInvitations({
    invitations,
    onAccept,
    onDecline,
}: TeamInvitationsProps) {
    if (invitations.length === 0) {
        return (
            <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                    Vous n'avez pas d'invitations d'équipe
                </p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {invitations.map((invitation) => (
                <Card
                    key={invitation.team.id}
                    className="p-6 border-l-4 border-l-blue-500"
                >
                    <div className="space-y-3">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {invitation.team.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Créée par{" "}
                                <span className="font-medium">
                                    {invitation.team.creator.name}
                                </span>
                            </p>
                        </div>

                        {invitation.team.description && (
                            <p className="text-sm">{invitation.team.description}</p>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">
                                {invitation.team.members.length} membres
                            </Badge>
                            <span className="text-muted-foreground">
                                Créée le{" "}
                                {new Date(
                                    invitation.team.createdAt
                                ).toLocaleDateString("fr-FR")}
                            </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => onAccept(invitation.team.id)}
                            >
                                Accepter
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDecline(invitation.team.id)}
                            >
                                Refuser
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
