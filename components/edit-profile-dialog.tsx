"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Loader2, Check, X } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { useUserProfile } from "@/lib/user-profile-context"

// email et password retirés : l'email ne se change plus ici, le mot de passe passe par Brevo
export type EditType = "username" | "banner" | "avatar" | "borderColor" | "usernameColor" | null

interface EditProfileDialogProps {
    isOpen: boolean
    onClose: () => void
    type: EditType
    currentValue?: string
    userId: string
}

export function EditProfileDialog({
    isOpen,
    onClose,
    type,
    currentValue = "",
}: EditProfileDialogProps) {
    const { profile } = useUserProfile()
    const [value, setValue] = useState(currentValue)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // États pour la validation du pseudo (inspiré de l'onboarding)
    const [isCheckingUsername, setIsCheckingUsername] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

    // États pour les listes d'items
    const [avatars, setAvatars] = useState<{ id: string; imageUrl: string; name: string }[]>([])
    const [borders, setBorders] = useState<{ id: string; colorValue: string; name: string }[]>([])
    const [banners, setBanners] = useState<{ id: string; imageUrl: string | null; name: string; colorValue: string | null }[]>([])
    const [usernameColors, setUsernameColors] = useState<{ id: string; colorValue: string; name: string }[]>([])

    const [isFetchingItems, setIsFetchingItems] = useState(false)

    // Reset et Fetching à l'ouverture
    useEffect(() => {
        if (isOpen) {
            setValue(currentValue)
            setError("")
            setUsernameAvailable(null)

            // Routage des fetchs selon le type
            if (type === "avatar") fetchCosmetics("avatar", setAvatars)
            if (type === "borderColor") fetchCosmetics("border", setBorders)
            if (type === "banner") fetchCosmetics("banner", setBanners)
            if (type === "usernameColor") fetchCosmetics("username_color", setUsernameColors)
        }
    }, [isOpen, type, currentValue])

    // Fetch générique pour les cosmétiques débloqués (Avatars, Borders, Banners, Colors)
    const fetchCosmetics = async (cosmeticType: string, setState: (items: any[]) => void) => {
        setIsFetchingItems(true)
        try {
            const res = await fetch(`/api/user/cosmetics/unlocked?type=${cosmeticType}`)
            if (res.ok) {
                const data = await res.json()
                setState(data || [])
            }
        } catch (err) { console.error(err) }
        finally { setIsFetchingItems(false) }
    }

    // Validation du pseudo (comme dans l'onboarding)
    const validateUsername = useCallback(async (username: string) => {
        setError("")
        setUsernameAvailable(null)

        if (username.length < 3) {
            setError("Le pseudo doit contenir au moins 3 caractères")
            return
        }

        if (username.length > 20) {
            setError("Le pseudo ne peut pas dépasser 20 caractères")
            return
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError("Le pseudo ne peut contenir que des lettres, chiffres et underscores")
            return
        }

        // Pas besoin de vérifier si c'est le même pseudo
        if (username === profile?.username) {
            setUsernameAvailable(true)
            return
        }

        setIsCheckingUsername(true)
        try {
            const response = await fetch(`/api/onboarding/check-username?username=${encodeURIComponent(username)}`)
            const data = await response.json()
            setUsernameAvailable(data.available)
            if (!data.available) {
                setError("Ce pseudo est déjà pris")
            }
        } catch {
            setError("Erreur lors de la vérification")
        } finally {
            setIsCheckingUsername(false)
        }
    }, [profile?.username])

    // Debounce pour la validation du pseudo
    useEffect(() => {
        if (type !== "username" || !value) return
        const timer = setTimeout(() => validateUsername(value), 300)
        return () => clearTimeout(timer)
    }, [value, type, validateUsername])

    if (!isOpen) return null

    // Configuration des textes
    const config: Record<string, { title: string; desc: string }> = {
        username: { title: "Changer le pseudo", desc: "Choisissez un pseudo unique (3-20 caractères, lettres, chiffres, underscores)." },
        banner: { title: "Choisir une bannière", desc: "Personnalisez l'arrière-plan de votre profil." },
        avatar: { title: "Choisir un avatar", desc: "Sélectionnez votre avatar parmi vos avatars débloqués." },
        borderColor: { title: "Couleur du contour", desc: "Personnalisez le cercle autour de votre avatar." },
        usernameColor: { title: "Couleur du pseudo", desc: "Choisissez la couleur de votre nom d'utilisateur." },
    }
    const currentConfig = type ? config[type] : { title: "", desc: "" }

    const handleSave = async () => {
        // Validation spécifique au pseudo
        if (type === "username" && (!usernameAvailable || isCheckingUsername)) {
            return
        }

        setIsLoading(true)
        setError("")

        // Mapping Type -> Clé API
        let bodyKey = type as string
        if (type === "banner") bodyKey = "bannerId"
        if (type === "avatar") bodyKey = "avatarId"
        if (type === "borderColor") bodyKey = "avatarBorderColor"
        if (type === "usernameColor") bodyKey = "usernameColor"

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [bodyKey]: value }),
            })
            if (!res.ok) throw new Error("Erreur serveur")
            window.location.reload()
        } catch {
            setError("Erreur lors de la sauvegarde")
        } finally {
            setIsLoading(false)
        }
    }

    // --- RENDU : PSEUDO (inspiré de l'onboarding) ---
    const renderUsernameInput = () => (
        <div className="space-y-4">
            {/* Prévisualisation du pseudo */}
            <div className="flex justify-center py-4">
                <div className="bg-muted px-6 py-4 rounded-xl">
                    <span
                        className="text-2xl font-bold"
                        style={{ color: profile?.usernameColor || '#ffffff' }}
                    >
                        {value || "Pseudo"}
                    </span>
                </div>
            </div>

            {/* Champ de saisie */}
            <div className="space-y-2">
                <Input
                    placeholder="Entrez votre nouveau pseudo"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={`h-12 text-center text-lg ${error ? "border-red-500 focus:ring-red-500" :
                        usernameAvailable ? "border-green-500 focus:ring-green-500" : ""
                        }`}
                    maxLength={20}
                />

                {/* Indicateurs de statut */}
                <div className="flex items-center justify-center gap-2 min-h-[24px]">
                    {isCheckingUsername && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Vérification...</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                            <X className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                    {usernameAvailable && !isCheckingUsername && !error && value.length >= 3 && (
                        <div className="flex items-center gap-2 text-green-500 text-sm">
                            <Check className="h-4 w-4" />
                            <span>Pseudo disponible</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Règles */}
            <p className="text-xs text-muted-foreground text-center">
                {value.length}/20 caractères
            </p>
        </div>
    )

    // --- RENDU : COULEURS DU PSEUDO (avec preview sur le vrai pseudo) ---
    const renderUsernameColorSelection = () => {
        if (isFetchingItems) {
            return (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
            )
        }

        const displayItems = usernameColors.length > 0 ? usernameColors : defaultUsernameColors

        return (
            <div className="space-y-6">
                {/* Prévisualisation avec le vrai pseudo */}
                <Card className="p-6 bg-muted/50">
                    <div className="flex justify-center">
                        <span
                            className="text-3xl font-bold transition-colors duration-200"
                            style={{ color: value || '#ffffff' }}
                        >
                            {profile?.username || "Pseudo"}
                        </span>
                    </div>
                </Card>

                {/* Grille de couleurs */}
                <div className="grid grid-cols-5 gap-3">
                    {displayItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setValue(item.colorValue)}
                            className={`group relative aspect-square rounded-full overflow-hidden transition-all duration-200 ${value === item.colorValue
                                ? "ring-2 ring-offset-2 ring-primary scale-110"
                                : "hover:scale-105 opacity-80 hover:opacity-100"
                                }`}
                            title={item.name}
                        >
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: item.colorValue }}
                            />
                            {value === item.colorValue && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // --- RENDU : COULEUR DU CONTOUR (avec preview sur l'avatar actuel) ---
    const renderBorderColorSelection = () => {
        if (isFetchingItems) {
            return (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
            )
        }

        const displayItems = borders.length > 0 ? borders : defaultBorders

        return (
            <div className="space-y-6">
                {/* Prévisualisation avec le vrai avatar */}
                <Card className="p-6 bg-muted/50">
                    <div className="flex justify-center">
                        <UserAvatar
                            avatar={profile?.avatar}
                            avatarBorderColor={value || '#22c55e'}
                            username={profile?.username}
                            size="xl"
                        />
                    </div>
                </Card>

                {/* Grille de couleurs */}
                <div className="grid grid-cols-5 gap-3">
                    {displayItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setValue(item.colorValue)}
                            className={`group relative aspect-square rounded-full overflow-hidden transition-all duration-200 ${value === item.colorValue
                                ? "ring-2 ring-offset-2 ring-primary scale-110"
                                : "hover:scale-105 opacity-80 hover:opacity-100"
                                }`}
                            title={item.name}
                        >
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: item.colorValue }}
                            />
                            {value === item.colorValue && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // --- RENDU : BANNIÈRES (prévisualisation complète de la user card) ---
    const renderBannerSelection = () => {
        if (isFetchingItems) {
            return (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
            )
        }

        const colorBanners = banners.filter(b => b.colorValue && !b.imageUrl)
        const imageBanners = banners.filter(b => b.imageUrl)

        // Trouver la bannière sélectionnée pour la prévisualisation
        const selectedBanner = banners.find(b => b.id === value)
        const previewColor = selectedBanner?.colorValue || profile?.banner?.colorValue || '#007047'
        const previewImage = selectedBanner?.imageUrl || (selectedBanner ? null : profile?.banner?.imageUrl)

        return (
            <div className="space-y-4">
                {/* Prévisualisation de la user card */}
                <Card className="overflow-hidden border-none relative h-28">
                    <div
                        className="absolute inset-0 transition-all duration-300"
                        style={{ backgroundColor: previewColor }}
                    >
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Bannière"
                                className="w-full h-full object-cover opacity-60"
                            />
                        )}
                    </div>
                    <div className="relative z-10 h-full flex items-center p-4 gap-4">
                        <UserAvatar
                            avatar={profile?.avatar}
                            avatarBorderColor={profile?.avatarBorderColor}
                            username={profile?.username}
                            size="lg"
                        />
                        <div>
                            <span
                                className="text-xl font-bold drop-shadow-md"
                                style={{ color: profile?.usernameColor || '#ffffff' }}
                            >
                                {profile?.username || "Pseudo"}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Sélection des bannières */}
                <ScrollArea className="h-[280px]">
                    <div className="space-y-4 pr-4">
                        {/* Couleurs */}
                        {colorBanners.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Couleurs de fond
                                </p>
                                <div className="grid grid-cols-6 gap-2">
                                    {colorBanners.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setValue(item.id)}
                                            className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 ${value === item.id
                                                ? "ring-2 ring-offset-2 ring-primary scale-105"
                                                : "hover:scale-105 opacity-80 hover:opacity-100"
                                                }`}
                                            title={item.name}
                                        >
                                            <div
                                                className="w-full h-full"
                                                style={{ backgroundColor: item.colorValue! }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Images */}
                        {imageBanners.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Bannières image
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {imageBanners.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setValue(item.id)}
                                            className={`relative rounded-lg overflow-hidden aspect-[3/1] transition-all duration-200 ${value === item.id
                                                ? "ring-2 ring-offset-2 ring-primary"
                                                : "hover:opacity-90 opacity-80"
                                                }`}
                                        >
                                            <img
                                                src={item.imageUrl!}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {value === item.id && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <Check className="text-white drop-shadow-lg" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {colorBanners.length === 0 && imageBanners.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">
                                Aucune bannière débloquée.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </div>
        )
    }

    // --- RENDU : AVATAR (avec UserAvatar et scroll horizontal) ---
    const renderAvatarSelection = () => {
        if (isFetchingItems) {
            return (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
            )
        }

        const selectedAvatar = avatars.find(a => a.id === value) || avatars[0]

        return (
            <div className="space-y-6">
                {/* Prévisualisation de l'avatar sélectionné */}
                <Card className="p-6 bg-muted/50">
                    <div className="flex justify-center">
                        <UserAvatar
                            avatar={selectedAvatar ? {
                                id: selectedAvatar.id,
                                name: selectedAvatar.name,
                                imageUrl: selectedAvatar.imageUrl
                            } : profile?.avatar}
                            avatarBorderColor={profile?.avatarBorderColor}
                            username={profile?.username}
                            size="xl"
                        />
                    </div>
                </Card>

                {/* Scroll horizontal des avatars */}
                <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-6 pt-2 pr-2">
                        {avatars.map((avatar) => (
                            <button
                                key={avatar.id}
                                onClick={() => setValue(avatar.id)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden transition-all duration-200 ${value === avatar.id
                                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                                    : "hover:scale-105 opacity-80 hover:opacity-100"
                                    }`}
                                title={avatar.name}
                            >
                                <UserAvatar
                                    avatar={{
                                        id: avatar.id,
                                        name: avatar.name,
                                        imageUrl: avatar.imageUrl
                                    }}
                                    size="lg"
                                    className="border-0"
                                />
                                {value === avatar.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {avatars.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center">
                        Aucun avatar disponible.
                    </p>
                )}
            </div>
        )
    }

    // --- DÉFINITION DES COULEURS PAR DÉFAUT ---
    const defaultUsernameColors = [
        { id: "username_color-pseudo-blanc", colorValue: "#f2f2f2", name: "Pseudo Blanc" },
        { id: "username_color-pseudo-noir", colorValue: "#181818", name: "Pseudo Noir" },
    ]
    const defaultBorders = [
        { id: "border-bordure-verte", colorValue: "#22c55e", name: "Bordure Verte" },
    ]

    // Déterminer si le bouton Enregistrer doit être désactivé
    const isSaveDisabled = () => {
        if (isLoading) return true
        if (type === "username") {
            return !value || !!error || isCheckingUsername || !usernameAvailable
        }
        return !value
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>{currentConfig.title}</DialogTitle>
                    <DialogDescription>{currentConfig.desc}</DialogDescription>
                </DialogHeader>

                {/* Contenu */}
                <div className="px-6 pb-4 overflow-y-auto flex-1">
                    {type === "username" && renderUsernameInput()}
                    {type === "avatar" && renderAvatarSelection()}
                    {type === "banner" && renderBannerSelection()}
                    {type === "borderColor" && renderBorderColorSelection()}
                    {type === "usernameColor" && renderUsernameColorSelection()}
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaveDisabled()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}