"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Users, Leaf, Flame, Loader2, Lock } from "lucide-react"
import Image from "next/image"

interface ProgressionItem {
    id: string
    label: string
    current: number
    target: number
    isCompleted: boolean
    reward: {
        id: string
        name: string
        imageUrl: string | null
        colorValue: string | null
    } | null
}

export function CosmeticProgressCard() {
    const [progressions, setProgressions] = useState<ProgressionItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await fetch("/api/user/progress")
                if (res.ok) {
                    const data = await res.json()
                    setProgressions(data)
                }
            } catch (error) {
                console.error("Erreur chargement progression", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProgress()
    }, [])

    const getIcon = (id: string) => {
        switch (id) {
            case "co2_personal": return <Leaf className="h-5 w-5 text-green-500" />
            case "streak": return <Flame className="h-5 w-5 text-orange-500" />
            case "referral": return <Users className="h-5 w-5 text-blue-400" />
            default: return <Trophy className="h-5 w-5 text-yellow-500" />
        }
    }

    if (isLoading) return (
        <Card className="w-full bg-[#121212] border-white/10 h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </Card>
    )

    return (
        <Card className="w-full bg-[#121212] border-white/10 text-white shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Prochains Cosmétiques
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                {progressions.map((item) => {
                    // Calcul du pourcentage (max 100%)
                    const percentage = Math.min(100, (item.current / item.target) * 100)
                    
                    return (
                        <div key={item.id} className="space-y-2">
                            {/* En-tête : Label et Compteur */}
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                                    {getIcon(item.id)}
                                    {item.label}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {item.isCompleted ? (
                                        <span className="text-green-500 font-bold">Max !</span>
                                    ) : (
                                        <span>
                                            <span className="text-white font-bold">{item.current}</span>
                                            <span className="mx-1">/</span>
                                            {item.target}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Zone principale : Barre + Aperçu Récompense */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Progress 
                                        value={percentage} 
                                        className="h-3 bg-white/10" 
                                        // Tu peux personnaliser la couleur de la barre de progression ici
                                        indicatorClassName={
                                            percentage >= 100 ? "bg-green-500" : "bg-green-600"
                                        }
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        {item.isCompleted 
                                            ? "Toutes les récompenses obtenues !" 
                                            : `Encore ${Math.max(0, item.target - item.current)} pour débloquer : ${item.reward?.name}`
                                        }
                                    </p>
                                </div>

                                {/* Miniature de la récompense (Carré à droite) */}
                                {!item.isCompleted && item.reward && (
                                    <div className="relative shrink-0 w-10 h-10 rounded-md border border-white/20 overflow-hidden bg-black/40 group cursor-help" title={`Récompense : ${item.reward.name}`}>
                                        {item.reward.imageUrl ? (
                                            <Image 
                                                src={item.reward.imageUrl} 
                                                alt={item.reward.name} 
                                                width={40} height={40} 
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full"
                                                style={{ backgroundColor: item.reward.colorValue || '#333' }}
                                            />
                                        )}
                                        {/* Icône de cadenas */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Lock className="h-4 w-4 text-white/80 drop-shadow-md" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}