"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, X } from "lucide-react"

interface CreateTeamProps {
    onCreateTeam: (name: string, description: string) => Promise<void>
}

export function CreateTeam({ onCreateTeam }: CreateTeamProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [teamName, setTeamName] = useState("")
    const [teamDescription, setTeamDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!teamName.trim()) {
            setError("Le nom de l'équipe est requis")
            return
        }

        setLoading(true)
        try {
            await onCreateTeam(teamName, teamDescription)
            setTeamName("")
            setTeamDescription("")
            setIsOpen(false)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de la création de l'équipe"
            )
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <Card className="p-6 text-center">
                <div className="space-y-4">
                    <Users className="w-12 h-12 mx-auto text-blue-500" />
                    <div>
                        <h3 className="text-xl font-semibold mb-2">
                            Créer une équipe
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Créez une équipe pour collaborer avec vos amis sur les
                            défis écologiques
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsOpen(true)}
                    >
                        Créer une équipe
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Créer une équipe</h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="teamName">Nom de l'équipe *</Label>
                    <Input
                        id="teamName"
                        placeholder="ex: Eco Warriors"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div>
                    <Label htmlFor="teamDescription">Description</Label>
                    <Input
                        id="teamDescription"
                        placeholder="ex: Une équipe dédiée à réduire son empreinte carbone"
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded">
                        {error}
                    </div>
                )}

                <div className="flex gap-2 pt-4">
                    <Button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Création..." : "Créer l'équipe"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                </div>
            </form>
        </Card>
    )
}
