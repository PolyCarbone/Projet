"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { InviteFriends } from "@/components/invite-friends"

interface InviteFriendsModalProps {
    isOpen: boolean
    onClose: () => void
    teamMemberIds: string[]
    onInvite: (friendId: string) => Promise<void>
}

export function InviteFriendsModal({
    isOpen,
    onClose,
    teamMemberIds,
    onInvite,
}: InviteFriendsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold">Inviter des amis</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <InviteFriends
                        teamMemberIds={teamMemberIds}
                        onInvite={onInvite}
                    />
                </div>
            </Card>
        </div>
    )
}
