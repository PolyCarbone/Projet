"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
    avatar?: {
        id: string
        name: string
        imageUrl: string
    } | null
    avatarBorderColor?: string | null
    username?: string | null
    userId?: string
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    clickable?: boolean
    isCurrentUser?: boolean
    className?: string
}

const sizeMap = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-28 w-28",
}

const borderWidthMap = {
    xs: "border",
    sm: "border-2",
    md: "border-2",
    lg: "border-3",
    xl: "border-4",
}

export function UserAvatar({
    avatar,
    avatarBorderColor,
    username,
    userId,
    size = "md",
    clickable = false,
    isCurrentUser = false,
    className,
}: UserAvatarProps) {
    const sizeClasses = sizeMap[size]
    const borderWidth = borderWidthMap[size]

    // Déterminer le lien de destination
    const getHref = () => {
        if (!clickable) return undefined
        if (isCurrentUser) return "/profile"
        // TODO: Implémenter la page de profil des autres utilisateurs
        // return `/users/${userId}`
        return undefined
    }

    const href = getHref()

    // Fallback: initiales du username
    const getInitials = () => {
        if (!username) return "?"
        return username.slice(0, 2).toUpperCase()
    }

    const avatarContent = (
        <div
            className={cn(
                "relative rounded-full overflow-hidden flex items-center justify-center bg-muted",
                sizeClasses,
                borderWidth,
                clickable && "cursor-pointer hover:opacity-80 transition-opacity",
                className
            )}
            style={{
                borderColor: avatarBorderColor || "#22c55e",
            }}
        >
            {avatar?.imageUrl ? (
                <Image
                    src={avatar.imageUrl}
                    alt={username || "Avatar"}
                    fill
                    className="object-cover"
                />
            ) : (
                <span className="text-muted-foreground font-semibold">
                    {getInitials()}
                </span>
            )}
        </div>
    )

    // Si cliquable et qu'on a un lien, wrapper dans un Link
    if (clickable && href) {
        return (
            <Link href={href} className="inline-block">
                {avatarContent}
            </Link>
        )
    }

    // Sinon retourner juste l'avatar
    return avatarContent
}
