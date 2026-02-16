"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
    const searchParams = useSearchParams()
    const emailFromParams = searchParams.get("email") || ""

    const [email, setEmail] = useState(emailFromParams)
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasEmailFromParams = !!emailFromParams

    const handleSendResetEmail = async (e?: React.FormEvent) => {
        e?.preventDefault()

        if (!email) {
            setError("Veuillez entrer une adresse email.")
            return
        }

        // Validation simple de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("Veuillez entrer une adresse email valide.")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // On ignore les erreurs pour ne pas révéler si l'email existe
            await authClient.requestPasswordReset({
                email,
                redirectTo: "/auth/reset-password",
            })
            setIsSent(true)
        } catch {
            // On affiche quand même le succès pour ne pas révéler si l'email existe
            setIsSent(true)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center gap-2 mb-6">
                    <Logo className="size-18" width={40} height={40} radiusClass="rounded-full" />
                    <span className="text-lg text-gray-600">PolyCarbone</span>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">
                            {isSent ? "Vérifiez votre boîte mail" : "Réinitialiser votre mot de passe"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isSent ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <p className="text-muted-foreground">
                                    Si un compte est associé à l'adresse{" "}
                                    <span className="font-semibold text-foreground">{email}</span>,
                                    vous recevrez un email de réinitialisation.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Vérifiez votre boîte de réception (et vos spams) et cliquez sur le lien
                                    pour définir un nouveau mot de passe. Le lien expire dans 1 heure.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Vous pouvez fermer cet onglet.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSendResetEmail} className="flex flex-col gap-4">
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <Mail className="h-12 w-12 text-muted-foreground" />
                                    {hasEmailFromParams ? (
                                        <>
                                            <p className="text-muted-foreground">
                                                Êtes-vous sûr de vouloir réinitialiser votre mot de passe ?
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Un email sera envoyé à{" "}
                                                <span className="font-semibold text-foreground">{email}</span>.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">
                                            Entrez votre adresse email pour recevoir un lien de réinitialisation.
                                        </p>
                                    )}
                                </div>

                                {!hasEmailFromParams && (
                                    <div className="space-y-2">
                                        <Input
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full"
                                >
                                    {isLoading ? "Envoi en cours..." : "Envoyer l'email de réinitialisation"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => window.close()}
                                    className="w-full"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Annuler
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
