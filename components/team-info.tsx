"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"

interface TeamInfoProps {
    teamName: string
    teamDescription?: string
    totalCO2Saved: number
    memberCount: number
    onLeaveTeam: () => void
    onInviteFriend: () => void
}

export function TeamInfo({
    teamName,
    teamDescription,
    totalCO2Saved,
    memberCount,
    onLeaveTeam,
    onInviteFriend,
}: TeamInfoProps) {
    return (
        <Card className="p-6 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{teamName}</h1>
                    {teamDescription && (
                        <p className="text-muted-foreground">{teamDescription}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Leaf className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-muted-foreground">
                                CO₂ économisé
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {totalCO2Saved.toFixed(2)} kg
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">
                            Membres de l'équipe
                        </p>
                        <p className="text-2xl font-bold">{memberCount}</p>
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <Button
                        onClick={onInviteFriend}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        + Inviter un ami
                    </Button>
                    <Button
                        onClick={onLeaveTeam}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Quitter l'équipe
                    </Button>
                </div>
            </div>
        </Card>
    )
}
