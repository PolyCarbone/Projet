"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
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
                    <Users className="w-12 h-12 mx-auto text-primary" />
                    <div>
                        <h3 className="text-xl mb-2 text-foreground">
                            Créer une équipe
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Créez une équipe pour collaborer avec vos amis sur les
                            défis écologiques
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full"
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
            <div className="flex items-center justify-between">
                <h2 className="text-2xl">Créer une équipe</h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Field>
                    <FieldLabel htmlFor="teamName">Nom de l'équipe *</FieldLabel>
                    <Input
                        id="teamName"
                        placeholder="Eco Warriors"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        disabled={loading}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="teamDescription">Description</FieldLabel>
                    <Input
                        id="teamDescription"
                        placeholder="Une description de l'équipe"
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        disabled={loading}
                    />
                </Field>

                {error && (
                    <FieldError>{error}</FieldError>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        type="submit"
                        className="flex-1"
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
