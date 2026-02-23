"use client"

import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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


interface TeamMembersListProps {
    members: TeamMember[]
    isCreator: boolean
    onRemoveMember?: (memberId: string) => void
}

export function TeamMembersList({
    members,
    isCreator,
    onRemoveMember,
}: TeamMembersListProps) {
    return (
        <div className="space-y-2">
            {members.map((member) => (
                <Card key={member.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            avatar={member.avatar}
                            avatarBorderColor={member.avatarBorderColor}
                            username={member.username || member.name}
                            userId={member.id}
                            size="md"
                            clickable={true}
                            isCurrentUser={false}
                        />
                        <div>
                            <p className="font-medium">@{member.username}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">
                            {member.totalCO2Saved.toFixed(2)} kg CO₂
                        </p>
                        {isCreator && onRemoveMember && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 mt-1"
                                onClick={() => onRemoveMember(member.id)}
                            >
                                Retirer
                            </Button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    )
}
