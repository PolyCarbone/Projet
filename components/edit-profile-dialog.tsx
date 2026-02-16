"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Check } from "lucide-react"
import Image from "next/image" // On utilise Image de Next.js comme dans l'onboarding

export type EditType = "username" | "email" | "password" | "banner" | "avatar" | null

interface EditProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  type: EditType
  currentValue?: string
  userId: string
  // On garde ça pour les bannières plus tard
  unlockedItems?: { id: string; imageUrl: string; name: string }[] 
}

export function EditProfileDialog({ 
  isOpen, 
  onClose, 
  type, 
  currentValue = "", 
  unlockedItems = [] 
}: EditProfileDialogProps) {
  const [value, setValue] = useState(currentValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // États spécifiques pour les Avatars (comme dans l'onboarding)
  const [avatars, setAvatars] = useState<{ id: string; imageUrl: string; name: string }[]>([])
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false)

  // Reset et Fetching à l'ouverture
  useEffect(() => {
    if (isOpen) {
        setValue(currentValue)
        setError("")
        
        // Si c'est le mode avatar, on va chercher la liste via l'API existante
        if (type === "avatar") {
            fetchAvatars()
        }
    }
  }, [isOpen, type, currentValue])

  const fetchAvatars = async () => {
      setIsLoadingAvatars(true)
      try {
          const res = await fetch("/api/onboarding/avatar")
          if (res.ok) {
              const data = await res.json()
              setAvatars(data.avatars || [])
          }
      } catch (err) {
          console.error("Erreur chargement avatars", err)
      } finally {
          setIsLoadingAvatars(false)
      }
  }

  if (!isOpen) return null

  // Configuration des textes
  const config: any = {
    username: { title: "Changer le pseudo", desc: "Choisissez un pseudo unique." },
    email: { title: "Changer l'email", desc: "Votre nouvel email de connexion." },
    password: { title: "Mot de passe", desc: "Nouveau mot de passe sécurisé." },
    banner: { title: "Choisir une bannière", desc: "Sélectionnez parmi vos items débloqués." },
    avatar: { title: "Choisir un avatar", desc: "Changez votre identité visuelle." },
  }
  const currentConfig = type ? config[type] : { title: "", desc: "" }

  const handleSave = async () => {
    setIsLoading(true); setError("")
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            [type === "banner" ? "bannerId" : type === "avatar" ? "avatarId" : type as string]: value 
        }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      window.location.reload()
    } catch (err) { setError("Erreur lors de la sauvegarde") } 
    finally { setIsLoading(false) }
  }

  // --- RENDU DU CONTENU SPÉCIFIQUE AVATAR ---
  const renderAvatarSelection = () => {
    if (isLoadingAvatars) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>

    // On trouve l'image de l'avatar sélectionné pour la prévisualisation
    const selectedAvatarUrl = avatars.find(a => a.id === value)?.imageUrl || avatars[0]?.imageUrl

    return (
        <div className="space-y-6">
             {/* 1. Prévisualisation (Gros Rond) */}
             <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-xl bg-black/20">
                    {selectedAvatarUrl && (
                        <Image 
                            src={selectedAvatarUrl} 
                            alt="Selected" 
                            width={128} 
                            height={128} 
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
             </div>

             {/* 2. Grille de choix (Petits Ronds) */}
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[250px] overflow-y-auto p-1">
                {avatars.map((avatar) => (
                    <button
                        key={avatar.id}
                        onClick={() => setValue(avatar.id)}
                        className={`relative aspect-square rounded-full overflow-hidden transition-transform ${
                            value === avatar.id 
                            ? "ring-4 ring-offset-2 ring-offset-[#121212] ring-green-500 scale-105" 
                            : "hover:scale-105 ring-2 ring-white/10 hover:ring-white/30"
                        }`}
                        title={avatar.name}
                    >
                        <Image 
                            src={avatar.imageUrl} 
                            alt={avatar.name} 
                            width={80} 
                            height={80} 
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
             </div>
        </div>
    )
  }

  // --- RENDU DU CONTENU SPÉCIFIQUE BANNIÈRE ---
  const renderBannerSelection = () => (
    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
        {unlockedItems.length > 0 ? unlockedItems.map((item) => (
        <div key={item.id} onClick={() => setValue(item.id)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 aspect-video ${value === item.id ? 'border-green-500' : 'border-transparent hover:border-white/20'}`}
        >
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            {value === item.id && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><Check className="text-white"/></div>}
        </div>
        )) : <p className="text-gray-500 text-sm col-span-2 text-center py-4">Aucun élément disponible</p>}
    </div>
  )

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
             type === "banner" ? renderBannerSelection() : (
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