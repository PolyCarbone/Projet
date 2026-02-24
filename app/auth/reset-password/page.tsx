"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { frenchLocale } from "@/lib/auth-locales"

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token") || ""
    const router = useRouter()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    function isPasswordStrong(password: string) {
        // Au moins une majuscule, une minuscule, un chiffre, un caractère spécial, et 12 caractères
        return /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password) &&
            password.length >= 12;
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error(frenchLocale["auth.error.password_mismatch"])
            return
        }

        if (!isPasswordStrong(password)) {
            toast.error(frenchLocale["auth.error.weak_password"])
            return
        }

        if (!token) {
            toast.error("Token de réinitialisation manquant ou invalide.")
            return
        }

        setIsLoading(true)

        try {
            const { error: authError } = await authClient.resetPassword({
                newPassword: password,
                token,
            })

            if (authError) {
                toast.error(authError.message || "Une erreur est survenue lors de la réinitialisation.")
            } else {
                setIsSuccess(true)
            }
        } catch {
            toast.error("Une erreur est survenue. Veuillez réessayer.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <Logo className="size-18" width={40} height={40} radiusClass="rounded-full" />
                        <span className="text-lg text-gray-600">PolyCarbone</span>
                    </div>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <AlertCircle className="h-16 w-16 text-destructive" />
                                <p className="text-muted-foreground">
                                    Lien de réinitialisation invalide ou expiré.
                                </p>
                                <Button onClick={() => router.push("/auth/portal")}>
                                    Retour à la connexion
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
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
                            {isSuccess ? "Mot de passe modifié !" : "Nouveau mot de passe"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isSuccess ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <p className="text-muted-foreground">
                                    Votre mot de passe a été modifié avec succès.
                                </p>
                                <Button onClick={() => router.push("/auth/portal")}>
                                    Se connecter
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <FieldGroup className="gap-3">
                                    <Field>
                                        <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={12}
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirmez votre mot de passe"
                                                required
                                                minLength={12}
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                        <FieldDescription>
                                            12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.
                                        </FieldDescription>
                                    </Field>

                                    <Field>
                                        <Button type="submit" disabled={isLoading} className="w-full">
                                            {isLoading ? "Modification en cours..." : "Modifier le mot de passe"}
                                        </Button>
                                    </Field>
                                </FieldGroup>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    )
}
