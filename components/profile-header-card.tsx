"use client"

import { useState } from "react"
import { Settings, Mail, Lock, User, CalendarDays, Captions, CircleUser } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { ImageIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditProfileDialog, EditType } from "./edit-profile-dialog"


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
        banner?: {
            id: string
            name: string
            imageUrl: string |null
            colorValue?: string | null
        } | null
        avatarBorderColor?: string | null
        userId: string
    }
    isCurrentUser?: boolean
    onEditEmail?: () => void
    onEditPassword?: () => void
    onEditUsername?: () => void
    onEditAvatar?: () => void
    onEditBanner?: () => void
}

export function ProfileHeaderCard({
    user,
    isCurrentUser = false,
    onEditEmail,
    onEditPassword,
    onEditUsername,
    onEditAvatar,
    onEditBanner,
}: ProfileHeaderCardProps) {
    const [editingType, setEditingType] = useState<EditType>(null)
    const isMobile = useIsMobile()

    // Helper pour savoir quoi envoyer à la modale comme valeur initiale
    const getInitialValue = () => {
        switch (editingType) {
            case "username": return user.username
            case "email": return user.email || ""
            case "banner": return user.banner?.id || ""
            case "avatar": return user.avatar?.id || ""
            default: return ""
        }
    }
    // MOCK DATA : Dans la réalité, tu passeras user.unlockedBanners ici
    // Tu devras probablement adapter tes props pour inclure les items débloqués
    const myBanners = [
        { id: "ban_1", name: "Forêt", imageUrl: "@public/images/banners/forest.jpg" },
        { id: "ban_2", name: "Océan", imageUrl: "@public/images/banners/forest.jpg" },
        // ...
    ]

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "Date inconnue"
        const d = new Date(date)
        return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    }

        return (
            <>
            <Card className="w-full overflow-hidden border-none relative  flex flex-col justify-end">
                {/* 1. FOND TOTAL (Couleur ou Image) */}
                <div 
                    className="absolute inset-0 z-0 transition-colors duration-500"
                    style={{ backgroundColor: user.banner?.colorValue || '#007047c9' }}
                >
                    {user.banner?.imageUrl && (
                        <img 
                            src={user.banner.imageUrl} 
                            className="w-full h-full object-cover opacity-60" 
                            alt="Banner" 
                        />
                    )}
                </div>

                {/* 2. BOUTON RÉGLAGES (En haut à droite, toujours visible) */}
                {isCurrentUser && (
                    <div className="absolute top-4 right-4 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 border-none shadow-lg">
                                    <Settings className="h-5 w-5 text-white" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setEditingType("username")}>
                                    <User className="mr-2 h-4 w-4" /> Modifier le pseudo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingType("email")}>
                                    <Mail className="mr-2 h-4 w-4" /> Modifier l'email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingType("password")}>
                                    <Lock className="mr-2 h-4 w-4" /> Modifier le mot de passe
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingType("avatar")}>
                                    <CircleUser className="mr-2 h-4 w-4" /> Modifier l'avatar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingType("banner")}>
                                    <ImageIcon className="mr-2 h-4 w-4" /> Modifier la bannière
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                {/* 3. CONTENU : Avatar à gauche, Infos à droite, poussé vers le bas */}
                <div className="relative z-10 mt-auto p-6 md:p-8 w-full">
                    <div className="flex flex-row items-center gap-6">
                        {/* Avatar : Pas de bordure noire, on utilise un effet de verre pour le fond vert */}
                        <div className="shrink-0 rounded-full">
                            <UserAvatar
                                avatar={user.avatar}
                                avatarBorderColor={user.avatarBorderColor}
                                username={user.username}
                                userId={user.userId}
                                size={isMobile ? "xl" : "lg"}
                            />
                        </div>

                        {/* Informations à DROITE de l'avatar */}
                        <div className="flex flex-col gap-1">
                            <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md">
                                {user.username}
                            </h2>
                            <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-1 text-white/90">
                                {user.email && (
                                    <div className="flex items-center gap-2 drop-shadow-sm text-sm md:text-base">
                                        <Mail className="h-4 w-4 shrink-0" />
                                        <span className="truncate max-w-[200px] md:max-w-none">{user.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 drop-shadow-sm text-sm md:text-base">
                                    <CalendarDays className="h-4 w-4 shrink-0" />
                                    <span>Membre depuis {formatDate(user.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            <EditProfileDialog 
                isOpen={!!editingType}
                onClose={() => setEditingType(null)}
                type={editingType}
                userId={user.userId}
                currentValue={getInitialValue()}
                // Exemple de données mockées pour l'instant
                unlockedItems={editingType === "banner" ? [
                    { id: "1", name: "Forest", imageUrl: "@public/images/banners/forest.jpg" }
                ] : []} 
            />

        </>
    )
}