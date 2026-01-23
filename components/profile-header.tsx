"use client"

import { useState } from "react"
import { Pencil, UserPlus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"

interface ProfileHeaderProps {
    user: {
        name: string
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
    onUpdateName?: (newName: string) => Promise<void>
}

export function ProfileHeader({ user, isOwnProfile = false, onUpdateName }: ProfileHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [tempName, setTempName] = useState(user.name)
    const [isLoading, setIsLoading] = useState(false)

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "Date inconnue"
        const d = new Date(date)
        return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    }

    const handleSave = async () => {
        if (onUpdateName && tempName !== user.name) {
            setIsLoading(true)
            try {
                await onUpdateName(tempName)
            } catch (error) {
                console.error("Failed to update name:", error)
                setTempName(user.name)
            } finally {
                setIsLoading(false)
            }
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setTempName(user.name)
        setIsEditing(false)
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
                    {isEditing && isOwnProfile ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="h-9 w-48 text-center bg-secondary border-border"
                                autoFocus
                                disabled={isLoading}
                            />
                            <Button size="sm" onClick={handleSave} className="h-9" disabled={isLoading}>
                                {isLoading ? "..." : "OK"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-9" disabled={isLoading}>
                                ✕
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground">{user.username}</h1>
                            {isOwnProfile && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 rounded-full bg-secondary hover:bg-muted transition-colors"
                                    aria-label="Modifier le nom"
                                >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    )}
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
