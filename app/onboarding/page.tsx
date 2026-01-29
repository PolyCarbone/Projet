"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, Loader2, LogOut, Mail, Maximize2, Minimize2 } from "lucide-react"
import Image from "next/image"

type OnboardingStep = "email-verification" | "username" | "avatar" | "carbon-test"

interface Avatar {
    id: string
    name: string
    imageUrl: string
}

interface UserData {
    email: string
    emailVerified: boolean
    username: string | null
    avatar: Avatar | null
    onboardingStep: number
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
    const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([])
    const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
    const [isLoadingAvatars, setIsLoadingAvatars] = useState(false)

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Carbon test state
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        fetchUserData()
    }, [])

    useEffect(() => {
        // Écouter les messages de l'iframe Nos Gestes Climat
        if (currentStep !== "carbon-test") return

        const handleMessage = async (event: MessageEvent) => {
            // Vérifier que le message vient de nosgestesclimat
            if (!event.origin.includes("nosgestesclimat")) {
                return
            }

            const message = event.data

            // Vérifier que c'est un message de partage de données
            if (typeof message === "string") {
                try {
                    const parsed = JSON.parse(message)
                    if (parsed.messageType === "ngc-iframe-share") {
                        await processNGCData(parsed.data)
                    }
                } catch {
                    // Ce n'est pas du JSON, ignorer
                }
            } else if (message?.messageType === "ngc-iframe-share") {
                await processNGCData(message.data)
            }
        }

        const processNGCData = async (data: any) => {
            // Extraire les données avec les clés courtes (t, a, l, d, s)
            const transport = data?.t ?? null
            const alimentation = data?.a ?? null
            const logement = data?.l ?? null
            const divers = data?.d ?? null
            const serviceSocietal = data?.s ?? null

            // Calculer le bilan total
            const carbonData = data?.footprints?.carbon
            const totalFootprint = carbonData?.bilan ??
                (transport ?? 0) + (alimentation ?? 0) + (logement ?? 0) + (divers ?? 0) + (serviceSocietal ?? 0)

            if (typeof totalFootprint !== "number" || totalFootprint === 0) {
                console.error("Le bilan n'est pas un nombre valide")
                return
            }

            try {
                const response = await fetch("/api/carbon-footprint", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        totalFootprint: totalFootprint,
                        transport: transport,
                        alimentation: alimentation,
                        logement: logement,
                        divers: divers,
                        serviceSocietal: serviceSocietal,
                        rawData: data,
                    }),
                })

                if (response.ok) {
                    // Rediriger vers le profil après l'onboarding
                    alert("🎉 Félicitations ! Votre bilan carbone a été enregistré. Bienvenue sur PolyCarbone !")
                    window.location.href = "/profile"
                } else {
                    console.error("Erreur lors de la sauvegarde:", await response.text())
                    alert("Erreur lors de la sauvegarde du bilan.")
                }
            } catch (error) {
                console.error("Erreur lors de la sauvegarde du bilan:", error)
                alert("Erreur lors de la sauvegarde du bilan.")
            }
        }

        window.addEventListener("message", handleMessage)

        return () => {
            window.removeEventListener("message", handleMessage)
        }
    }, [currentStep])

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
        } else if (!data.avatar) {
            setCurrentStep("avatar")
            setUsername(data.username)
            fetchAvailableAvatars()
        } else if (!data.hasCarbonFootprint) {
            setCurrentStep("carbon-test")
            setUsername(data.username)
            setSelectedAvatarId(data.avatar.id)
        } else {
            // Onboarding completed, redirect to home
            router.push("/")
        }
    }

    const fetchAvailableAvatars = async () => {
        setIsLoadingAvatars(true)
        try {
            const response = await fetch("/api/onboarding/avatar")
            if (response.ok) {
                const data = await response.json()
                setAvailableAvatars(data.avatars)
                // Sélectionner le premier avatar par défaut
                if (data.avatars.length > 0) {
                    setSelectedAvatarId(data.avatars[0].id)
                }
            } else {
                console.error("Failed to fetch avatars, status:", response.status)
            }
        } catch (error) {
            console.error("Failed to fetch avatars:", error)
        } finally {
            setIsLoadingAvatars(false)
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
        if (!selectedAvatarId) return

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/onboarding/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarId: selectedAvatarId }),
            })

            if (response.ok) {
                setCurrentStep("carbon-test")
                fetchAvailableAvatars()
            } else {
                console.error("Failed to save avatar")
            }
        } catch (error) {
            console.error("Error saving avatar:", error)
        } finally {
            setIsSubmitting(false)
        }
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

    // Mode plein écran pour le test carbone
    if (currentStep === "carbon-test" && isFullscreen) {
        return (
            <div className="h-screen w-screen overflow-hidden relative">
                <Button
                    onClick={() => setIsFullscreen(false)}
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 z-50 shadow-lg"
                >
                    <Minimize2 className="h-4 w-4" />
                </Button>

                <iframe
                    id="iframeNosGestesClimat"
                    src={`https://nosgestesclimat.fr/simulateur/bilan?iframe=true&integratorUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&shareData=true&onlySimulation=true`}
                    className="w-full h-full border-none"
                    allow="fullscreen; clipboard-write"
                    allowFullScreen
                    title="Simulateur Nos Gestes Climat"
                />
            </div>
        )
    }

    // Interface avec iframe pour le test carbone
    if (currentStep === "carbon-test") {
        return (
            <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-green-500 to-emerald-700">
                <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4">
                    <div className="container mx-auto flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            className="text-white hover:bg-white/20"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour
                        </Button>
                        <h1 className="text-lg font-semibold text-white">
                            Calculez votre empreinte carbone
                        </h1>
                        <Button
                            onClick={() => setIsFullscreen(true)}
                            size="icon"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            title="Plein écran"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 p-4">
                    <iframe
                        id="iframeNosGestesClimat"
                        src={`https://nosgestesclimat.fr/simulateur/bilan?iframe=true&integratorUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&shareData=true&onlySimulation=true`}
                        className="w-full h-full border-none rounded-lg bg-white"
                        allow="fullscreen; clipboard-write"
                        allowFullScreen
                        title="Simulateur Nos Gestes Climat"
                    />
                </div>
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
                    </CardTitle>
                    <CardDescription className="text-center">
                        {currentStep === "email-verification" && "Cliquez sur le lien envoyé par email"}
                        {currentStep === "username" && "Ce pseudo sera visible par les autres utilisateurs"}
                        {currentStep === "avatar" && "Choisissez un avatar pour vous représenter"}
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
                            {isLoadingAvatars ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : availableAvatars.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Aucun avatar disponible</p>
                                    <Button variant="outline" onClick={fetchAvailableAvatars} className="mt-4">
                                        Réessayer
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Preview */}
                                    <div className="flex justify-center">
                                        {selectedAvatarId && (
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                                                <Image
                                                    src={availableAvatars.find(a => a.id === selectedAvatarId)?.imageUrl || ''}
                                                    alt="Avatar sélectionné"
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Avatar picker */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {availableAvatars.map((avatar) => (
                                            <button
                                                key={avatar.id}
                                                onClick={() => setSelectedAvatarId(avatar.id)}
                                                className={`relative aspect-square rounded-full overflow-hidden transition-transform ${selectedAvatarId === avatar.id
                                                    ? "ring-4 ring-offset-2 ring-green-500 scale-105"
                                                    : "hover:scale-105 ring-2 ring-gray-200"
                                                    }`}
                                                title={avatar.name}
                                            >
                                                <Image
                                                    src={avatar.imageUrl}
                                                    alt={avatar.name}
                                                    width={100}
                                                    height={100}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={goBack} className="flex-1">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Retour
                                        </Button>
                                        <Button
                                            onClick={handleSubmitAvatar}
                                            disabled={isSubmitting || !selectedAvatarId}
                                            className="flex-1"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : null}
                                            Continuer
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
