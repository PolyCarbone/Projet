"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, Loader2, LogOut, Mail } from "lucide-react"

const AVATAR_COLORS = [
    { name: "Vert", value: "#22c55e" },
    { name: "Bleu", value: "#3b82f6" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Rose", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Rouge", value: "#ef4444" },
    { name: "Jaune", value: "#eab308" },
    { name: "Cyan", value: "#06b6d4" },
]

type OnboardingStep = "email-verification" | "username" | "avatar" | "carbon-test"

interface UserData {
    email: string
    emailVerified: boolean
    username: string | null
    avatarColor: string | null
    onboardingStep: number
    onboardingCompleted: boolean
    hasCarbonFootprint: boolean
}

export default function OnboardingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [currentStep, setCurrentStep] = useState<OnboardingStep>("email-verification")
    const [userData, setUserData] = useState<UserData | null>(null)

    // Username state
    const [username, setUsername] = useState("")
    const [usernameError, setUsernameError] = useState("")
    const [isCheckingUsername, setIsCheckingUsername] = useState(false)

    // Avatar state
    const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].value)

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            const response = await fetch("/api/onboarding/status")
            if (!response.ok) {
                router.push("/auth/portal?mode=login")
                return
            }
            const data = await response.json()
            setUserData(data)
            determineCurrentStep(data)
        } catch (error) {
            console.error("Failed to fetch user data:", error)
            router.push("/auth/portal?mode=login")
        } finally {
            setIsLoading(false)
        }
    }

    const determineCurrentStep = (data: UserData) => {
        if (!data.emailVerified) {
            setCurrentStep("email-verification")
        } else if (!data.username) {
            setCurrentStep("username")
        } else if (!data.avatarColor) {
            setCurrentStep("avatar")
            setUsername(data.username)
        } else if (!data.hasCarbonFootprint) {
            setCurrentStep("carbon-test")
            setUsername(data.username)
            setSelectedColor(data.avatarColor)
        } else {
            // Onboarding completed, redirect to home
            router.push("/")
        }
    }

    const handleLogout = async () => {
        try {
            await authClient.signOut()
            router.push("/auth/portal?mode=login")
        } catch (error) {
            console.error("Error logging out:", error)
        }
    }

    const handleUsernameChange = async (value: string) => {
        setUsername(value)
        setUsernameError("")

        if (value.length < 3) {
            setUsernameError("Le pseudo doit contenir au moins 3 caractères")
            return
        }

        if (value.length > 20) {
            setUsernameError("Le pseudo ne peut pas dépasser 20 caractères")
            return
        }

        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            setUsernameError("Le pseudo ne peut contenir que des lettres, chiffres et underscores")
            return
        }

        // Check availability
        setIsCheckingUsername(true)
        try {
            const response = await fetch(`/api/onboarding/check-username?username=${encodeURIComponent(value)}`)
            const data = await response.json()
            if (!data.available) {
                setUsernameError("Ce pseudo est déjà pris")
            }
        } catch {
            setUsernameError("Erreur lors de la vérification")
        } finally {
            setIsCheckingUsername(false)
        }
    }

    const handleSubmitUsername = async () => {
        if (usernameError || !username || isCheckingUsername) return

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/onboarding/username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            })

            if (response.ok) {
                setCurrentStep("avatar")
            } else {
                const data = await response.json()
                setUsernameError(data.error || "Erreur lors de la sauvegarde")
            }
        } catch {
            setUsernameError("Erreur lors de la sauvegarde")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitAvatar = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch("/api/onboarding/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarColor: selectedColor }),
            })

            if (response.ok) {
                setCurrentStep("carbon-test")
            }
        } catch (error) {
            console.error("Error saving avatar:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStartCarbonTest = () => {
        router.push("/evaluation?onboarding=true")
    }

    const handleResendEmail = async () => {
        setIsSubmitting(true)
        try {
            await authClient.sendVerificationEmail({
                email: userData?.email || "",
                callbackURL: "/onboarding",
            })
            alert("Email de vérification envoyé !")
        } catch (error) {
            console.error("Error resending email:", error)
            alert("Erreur lors de l'envoi de l'email")
        } finally {
            setIsSubmitting(false)
        }
    }

    const goBack = () => {
        if (currentStep === "avatar") {
            setCurrentStep("username")
        } else if (currentStep === "carbon-test") {
            setCurrentStep("avatar")
        }
    }

    const getStepNumber = () => {
        switch (currentStep) {
            case "email-verification": return 0
            case "username": return 1
            case "avatar": return 2
            case "carbon-test": return 3
            default: return 0
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    {/* Progress indicator */}
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`h-2 w-12 rounded-full transition-colors ${step <= getStepNumber() ? "bg-green-500" : "bg-gray-200"
                                    }`}
                            />
                        ))}
                    </div>

                    <CardTitle className="text-center">
                        {currentStep === "email-verification" && "Vérifiez votre email"}
                        {currentStep === "username" && "Choisissez votre pseudo"}
                        {currentStep === "avatar" && "Personnalisez votre avatar"}
                        {currentStep === "carbon-test" && "Calculez votre empreinte"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {currentStep === "email-verification" && "Cliquez sur le lien envoyé par email"}
                        {currentStep === "username" && "Ce pseudo sera visible par les autres utilisateurs"}
                        {currentStep === "avatar" && "Choisissez une couleur pour votre profil"}
                        {currentStep === "carbon-test" && "Dernière étape : faites votre premier bilan carbone"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Email Verification Step */}
                    {currentStep === "email-verification" && (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-yellow-600" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Un email de vérification a été envoyé à <strong>{userData?.email}</strong>.
                                Cliquez sur le lien pour continuer.
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleResendEmail}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Renvoyer l'email
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={fetchUserData}
                                className="block mx-auto"
                            >
                                J'ai vérifié mon email
                            </Button>
                            <div className="pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Se déconnecter
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Username Step */}
                    {currentStep === "username" && (
                        <div className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Votre pseudo"
                                    value={username}
                                    onChange={(e) => handleUsernameChange(e.target.value)}
                                    className={usernameError ? "border-red-500" : ""}
                                />
                                {isCheckingUsername && (
                                    <p className="text-sm text-muted-foreground mt-1">Vérification...</p>
                                )}
                                {usernameError && (
                                    <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                                )}
                                {username && !usernameError && !isCheckingUsername && username.length >= 3 && (
                                    <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                                        <Check className="h-4 w-4" /> Pseudo disponible
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={handleSubmitUsername}
                                disabled={!!usernameError || !username || isCheckingUsername || isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Continuer
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                            <div className="pt-4 border-t text-center">
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Se déconnecter
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Avatar Step */}
                    {currentStep === "avatar" && (
                        <div className="space-y-4">
                            {/* Preview */}
                            <div className="flex justify-center">
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                                    style={{ backgroundColor: selectedColor }}
                                >
                                    {username.slice(0, 2).toUpperCase()}
                                </div>
                            </div>

                            {/* Color picker */}
                            <div className="grid grid-cols-4 gap-3">
                                {AVATAR_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`w-12 h-12 rounded-full mx-auto transition-transform ${selectedColor === color.value
                                            ? "ring-4 ring-offset-2 ring-gray-400 scale-110"
                                            : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={goBack} className="flex-1">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour
                                </Button>
                                <Button
                                    onClick={handleSubmitAvatar}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Continuer
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Carbon Test Step */}
                    {currentStep === "carbon-test" && (
                        <div className="space-y-4 text-center">
                            <div
                                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
                                style={{ backgroundColor: selectedColor }}
                            >
                                {username.slice(0, 2).toUpperCase()}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Bienvenue <strong>@{username}</strong> !<br />
                                Pour terminer, calculez votre empreinte carbone avec le simulateur Nos Gestes Climat.
                            </p>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={goBack} className="flex-1">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour
                                </Button>
                                <Button onClick={handleStartCarbonTest} className="flex-1">
                                    Commencer le test
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
