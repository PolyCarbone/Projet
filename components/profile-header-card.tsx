"use client"

import { useState } from "react"
import { Settings, Mail, Lock, User, CalendarDays } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProfileHeaderCardProps {
    user: {
        username: string
        email?: string
        createdAt?: Date | string
        avatar?: {
            id: string
            name: string
            imageUrl: string
        } | null
        avatarBorderColor?: string | null
        userId: string
    }
    isCurrentUser?: boolean
    onEditEmail?: () => void
    onEditPassword?: () => void
    onEditUsername?: () => void
}

export function ProfileHeaderCard({
    user,
    isCurrentUser = false,
    onEditEmail,
    onEditPassword,
    onEditUsername
}: ProfileHeaderCardProps) {
    const isMobile = useIsMobile()

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "Date inconnue"
        const d = new Date(date)
        return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    }

    return (
        <Card className={`w-full ${isMobile ? "p-3" : "p-6"} relative`}>
            <div className={`flex items-center ${isMobile ? "gap-3" : "gap-6"}`}>
                {/* Avatar à gauche */}
                <div className="flex-shrink-0">
                    <UserAvatar
                        avatar={user.avatar}
                        avatarBorderColor={user.avatarBorderColor}
                        username={user.username}
                        userId={user.userId}
                        size={isMobile ? "lg" : "xl"}
                        clickable={false}
                        priority={true}
                    />
                </div>

                {/* Informations utilisateur au centre */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                    <h2 className="text-2xl font-bold text-foreground">
                        {user.username}
                    </h2>
                    {isCurrentUser && user.email && (
                        <p className="text-sm text-muted-foreground">
                            {user.email}
                        </p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>depuis {formatDate(user.createdAt)}</span>
                    </div>
                </div>

                {/* Menu de réglages en haut à droite */}
                {isCurrentUser && (
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full hover:bg-muted"
                                >
                                    <Settings className="h-6 w-6 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                    onClick={onEditEmail}
                                    className="cursor-pointer"
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    <span>Modifier l'email</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onEditPassword}
                                    className="cursor-pointer"
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    <span>Modifier le mot de passe</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onEditUsername}
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Modifier le pseudo</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </Card>
    )
}
