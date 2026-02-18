"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Check } from "lucide-react"
import Image from "next/image"

// 1. On ajoute usernameColor
export type EditType = "username" | "email" | "password" | "banner" | "avatar" | "borderColor" | "usernameColor" | null

interface EditProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  type: EditType
  currentValue?: string
  userId: string
  // On n'a plus besoin de unlockedItems car tout est chargé dynamiquement maintenant
}

export function EditProfileDialog({ 
  isOpen, 
  onClose, 
  type, 
  currentValue = "", 
}: EditProfileDialogProps) {
  const [value, setValue] = useState(currentValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // États pour les listes d'items
  const [avatars, setAvatars] = useState<{ id: string; imageUrl: string; name: string }[]>([])
  const [borders, setBorders] = useState<{ id: string; colorValue: string; name: string }[]>([])
  const [banners, setBanners] = useState<{ id: string; imageUrl: string; name: string }[]>([]) // <-- Nouveau
  const [usernameColors, setUsernameColors] = useState<{ id: string; colorValue: string; name: string }[]>([]) // <-- Nouveau
  
  const [isFetchingItems, setIsFetchingItems] = useState(false)

  // Reset et Fetching à l'ouverture
  useEffect(() => {
    if (isOpen) {
        setValue(currentValue)
        setError("")
        
        // Routage des fetchs selon le type
        if (type === "avatar") fetchAvatars()
        if (type === "borderColor") fetchCosmetics("border", setBorders)
        if (type === "banner") fetchCosmetics("banner", setBanners)         // <-- Nouveau
        if (type === "usernameColor") fetchCosmetics("username_color", setUsernameColors) // <-- Nouveau
    }
  }, [isOpen, type, currentValue])

  // Fetch spécifique pour l'onboarding (API différente)
  const fetchAvatars = async () => {
      setIsFetchingItems(true)
      try {
          const res = await fetch("/api/onboarding/avatar")
          if (res.ok) {
              const data = await res.json()
              setAvatars(data.avatars || [])
          }
      } catch (err) { console.error(err) } 
      finally { setIsFetchingItems(false) }
  }

  // Fetch générique pour les cosmétiques débloqués (Borders, Banners, Colors)
  const fetchCosmetics = async (cosmeticType: string, setState: any) => {
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

  if (!isOpen) return null

  // Configuration des textes
  const config: any = {
    username: { title: "Changer le pseudo", desc: "Choisissez un pseudo unique." },
    email: { title: "Changer l'email", desc: "Votre nouvel email de connexion." },
    password: { title: "Mot de passe", desc: "Nouveau mot de passe sécurisé." },
    banner: { title: "Choisir une bannière", desc: "Sélectionnez parmi vos items débloqués." },
    avatar: { title: "Choisir un avatar", desc: "Changez votre identité visuelle." },
    borderColor: { title: "Couleur du contour", desc: "Personnalisez le cercle autour de votre avatar." },
    usernameColor: { title: "Couleur du pseudo", desc: "Choisissez la couleur de votre nom." },
  }
  const currentConfig = type ? config[type] : { title: "", desc: "" }

  const handleSave = async () => {
    setIsLoading(true); setError("")
    
    // Mapping Type -> Clé API
    let bodyKey = type as string;
    if (type === "banner") bodyKey = "bannerId";
    if (type === "avatar") bodyKey = "avatarId";
    if (type === "borderColor") bodyKey = "avatarBorderColor";
    if (type === "usernameColor") bodyKey = "usernameColor"; // Assure-toi que ton API PATCH gère cette clé

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: value }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      window.location.reload()
    } catch (err) { setError("Erreur lors de la sauvegarde") } 
    finally { setIsLoading(false) }
  }

  // --- RENDU : COULEURS (Bordures & Pseudo) ---
  const renderColorSelection = (items: any[], defaultItems: any[]) => {
    if (isFetchingItems) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>

    // Utilise les items débloqués OU les défauts si vide
    const displayItems = items.length > 0 ? items : defaultItems;

    return (
        <div className="space-y-6">
             {/* Prévisualisation */}
             <div className="flex justify-center py-4">
                {type === "borderColor" ? (
                    <div className="w-24 h-24 rounded-full bg-[#202020] flex items-center justify-center border-4 transition-all duration-300"
                        style={{ borderColor: value || '#22c55e' }}>
                        <span className="text-xs text-gray-500">Aperçu</span>
                    </div>
                ) : (
                    <div className="text-3xl font-bold bg-[#202020] px-6 py-3 rounded-lg"
                        style={{ color: value || '#ffffff' }}>
                        Pseudo
                    </div>
                )}
             </div>

             {/* Grille */}
             <div className="grid grid-cols-5 gap-4 px-2">
                {displayItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setValue(item.colorValue)}
                        className={`group relative w-12 h-12 rounded-full overflow-hidden transition-all ${
                            value === item.colorValue 
                            ? "ring-2 ring-offset-2 ring-offset-[#121212] ring-white scale-110" 
                            : "hover:scale-110 opacity-80 hover:opacity-100"
                        }`}
                        title={item.name}
                    >
                        <div className="w-full h-full" style={{ backgroundColor: item.colorValue }} />
                        {value === item.colorValue && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Check className="w-5 h-5 text-white drop-shadow-md" />
                            </div>
                        )}
                    </button>
                ))}
             </div>
        </div>
    )
  }

  // --- RENDU : BANNIÈRES ---
  const renderBannerSelection = () => {
    if (isFetchingItems) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>
    
    return (
        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {banners.length > 0 ? banners.map((item) => (
            <div key={item.id} onClick={() => setValue(item.id)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 aspect-video ${value === item.id ? 'border-green-500' : 'border-transparent hover:border-white/20'}`}
            >
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                {value === item.id && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check className="text-white"/></div>}
            </div>
            )) : <p className="text-gray-500 text-sm col-span-2 text-center py-4">Aucune bannière débloquée.</p>}
        </div>
    )
  }

  // --- RENDU : AVATAR ---
  const renderAvatarSelection = () => {
    if (isFetchingItems) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>
    const selectedAvatarUrl = avatars.find(a => a.id === value)?.imageUrl || avatars[0]?.imageUrl

    return (
        <div className="space-y-6">
             <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-xl bg-black/20">
                    {selectedAvatarUrl && (
                        <Image src={selectedAvatarUrl} alt="Selected" width={128} height={128} className="w-full h-full object-cover" />
                    )}
                </div>
             </div>
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[250px] overflow-y-auto p-1">
                {avatars.map((avatar) => (
                    <button key={avatar.id} onClick={() => setValue(avatar.id)}
                        className={`relative aspect-square rounded-full overflow-hidden transition-transform ${
                            value === avatar.id ? "ring-4 ring-offset-2 ring-offset-[#121212] ring-green-500 scale-105" : "hover:scale-105 ring-2 ring-white/10 hover:ring-white/30"
                        }`}
                        title={avatar.name}
                    >
                        <Image src={avatar.imageUrl} alt={avatar.name} width={80} height={80} className="w-full h-full object-cover" />
                    </button>
                ))}
             </div>
        </div>
    )
  }

  // --- DÉFINITION DES COULEURS PAR DÉFAUT ---
  const defaultColors = [
        { id: "def_1", colorValue: "#22c55e", name: "Vert" },
        { id: "def_2", colorValue: "#ffffff", name: "Blanc" },
        { id: "def_3", colorValue: "#3b82f6", name: "Bleu" },
        { id: "def_4", colorValue: "#ef4444", name: "Rouge" },
        { id: "def_5", colorValue: "#eab308", name: "Jaune" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#121212] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 shrink-0">
            <div>
                <h2 className="text-xl font-bold text-white">{currentConfig.title}</h2>
                <p className="text-sm text-gray-400 mt-1">{currentConfig.desc}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
            </button>
        </div>

        {/* Contenu Scrollable */}
        <div className="py-2 overflow-y-auto">
            {type === "avatar" ? renderAvatarSelection() : 
             type === "banner" ? renderBannerSelection() :
             type === "borderColor" ? renderColorSelection(borders, defaultColors) :
             type === "usernameColor" ? renderColorSelection(usernameColors, defaultColors) :
             (
                <Input 
                    value={value} onChange={(e) => setValue(e.target.value)} 
                    type={type === "password" ? "password" : "text"}
                    className="bg-white/5 border-white/10 text-white focus:border-green-500"
                />
            )}
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 shrink-0 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={onClose} disabled={isLoading} className="text-gray-300 hover:text-white hover:bg-white/10">Annuler</Button>
            <Button onClick={handleSave} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
            </Button>
        </div>
      </div>
    </div>
  )
}