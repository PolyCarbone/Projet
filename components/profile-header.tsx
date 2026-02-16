"use client"

import { UserPlus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"

interface ProfileHeaderProps {
    user: {
        email: string
        image?: string | null
        createdAt?: Date | string
        username: string
        avatar?: {
            id: string
            name: string
            imageUrl: string
        } | null
        avatarBorderColor?: string | null
    }
    isOwnProfile?: boolean
}

export function ProfileHeader({ user, isOwnProfile = false }: ProfileHeaderProps) {
    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "Date inconnue"
        const d = new Date(date)
        return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    }

    return (
        <div className="pb-8 w-full">
            {/* Banner & Avatar Section */}
            <div className="relative">
                {/* Avatar - positioned to overlap banner */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-14">
                    <div className="relative">
                        <UserAvatar
                            avatar={user.avatar}
                            avatarBorderColor={user.avatarBorderColor}
                            username={user.username}
                            size="xl"
                            clickable={false}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pt-18 space-y-4">
                {/* Username Section */}
                <div className="flex flex-col items-center gap-2 pt-4">
                    <h1 className="text-xl font-bold text-foreground">{user.username}</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Membre depuis {formatDate(user.createdAt)}
                    </p>
                </div>

                {/* Add Friend Button - only show if not own profile */}
                {!isOwnProfile && (
                    <div className="flex justify-center">
                        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                            <UserPlus className="h-4 w-4" />
                            Ajouter en ami
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
