"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowBigLeftDash } from "lucide-react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/lib/auth-context"
import { translateAuthError } from "@/lib/auth-errors"
import { frenchLocale } from "@/lib/auth-locales"

type AuthMode = "login" | "signup"

export function AuthForm({
    className,
    defaultMode = "login",
    ...props
}: React.ComponentProps<"div"> & { defaultMode?: AuthMode }) {
    const searchParams = useSearchParams()
    const modeParam = searchParams.get("mode")
    const referralCode = searchParams.get("ref")
    const initialMode = (modeParam === "signup" || modeParam === "login") ? modeParam : defaultMode

    const [mode, setMode] = useState<AuthMode>(initialMode)
    const [isLoading, setIsLoading] = useState(false)
    const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    })
    const router = useRouter()
    const { refreshSession } = useAuth()

    // Update mode when URL parameter changes
    useEffect(() => {
        if (modeParam === "signup" || modeParam === "login") {
            setMode(modeParam)
            setStep(1)
        }
    }, [modeParam])

    // Reset form when switching modes
    const switchMode = (newMode: AuthMode) => {
        setMode(newMode)
        setStep(1)
        setFormData({
            email: "",
            password: "",
            confirmPassword: ""
        })
        setIsLoading(false)
        setIsSocialLoading(null)

        // Update URL parameter
        const url = new URL(window.location.href)
        url.searchParams.set("mode", newMode)
        router.push(url.pathname + url.search, { scroll: false })
    }

    async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formDataObj = new FormData(e.currentTarget)
        const email = formDataObj.get("email") as string
        const password = formDataObj.get("password") as string

        try {
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            })

            if (error) {
                toast.error(translateAuthError(error))
                setIsLoading(false)
                return
            }

            toast.success("Connexion réussie !")
            await refreshSession()
            router.push("/challenges")
            router.refresh()
        } catch (error: any) {
            toast.error(translateAuthError(error as any))
            setIsLoading(false)
        }
    }


    function isPasswordStrong(password: string) {
        // Au moins une majuscule, une minuscule, un chiffre, un caractère spécial, et 12 caractères
        return /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password) &&
            password.length >= 12;
    }

    async function handleSignupSubmit() {
        setIsLoading(true)

        const { email, password, confirmPassword } = formData

        // Validation
        if (password !== confirmPassword) {
            toast.error(frenchLocale["auth.error.password_mismatch"])
            setIsLoading(false)
            return
        }

        if (!isPasswordStrong(password)) {
            toast.error("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.")
            setIsLoading(false)
            return
        }

        try {
            // Extraire un nom par défaut depuis l'email
            const emailName = email.split('@')[0].split('.').map((part: string) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join(' ')

            const { data, error } = await authClient.signUp.email({
                email,
                password,
                name: emailName,
            })

            if (error) {
                toast.error(translateAuthError(error))
                setIsLoading(false)
                return
            }

            toast.success("Inscription réussie ! Vérifiez votre email pour continuer.")
            await refreshSession()

            // Sauvegarder le code de parrainage pour le traiter à la fin de l'onboarding
            if (referralCode) {
                localStorage.setItem("referralCode", referralCode)
            }

            setTimeout(() => {
                router.push("/onboarding")
                router.refresh()
            }, 1000)
        } catch (error: any) {
            toast.error(translateAuthError(error as any))
            setIsLoading(false)
        }
    }

    async function handleSocialAuth(provider: "google") {
        setIsSocialLoading(provider)

        // Sauvegarder le code de parrainage avant la redirection OAuth
        if (referralCode) {
            localStorage.setItem("referralCode", referralCode)
        }

        try {
            await authClient.signIn.social({
                provider,
                callbackURL: "/",
            })
        } catch (error: any) {
            toast.error(error?.message || `Erreur lors de la connexion avec ${provider}`)
            setIsSocialLoading(null)
        }
    }

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validation de l'étape 1
        if (!formData.email || !formData.email.includes("@")) {
            toast.error("Veuillez entrer une adresse email valide")
            return
        }

        setStep(2)
    }

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault()
        handleSignupSubmit()
    }

    return (
        <div className={cn("flex flex-col gap-3", className)} {...props}>
            <Card>
                <CardHeader className="text-center space-y-4">
                    <CardTitle className="text-xl">
                        {mode === "login" ? "Se connecter" : "S'inscrire"}
                    </CardTitle>

                    {/* Mode Switcher */}
                    <div className="inline-flex items-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
                        <button
                            type="button"
                            onClick={() => switchMode("login")}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-1/2",
                                mode === "login" && "bg-background text-foreground shadow-sm"
                            )}
                            disabled={isLoading || isSocialLoading !== null}
                        >
                            Connexion
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode("signup")}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-1/2",
                                mode === "signup" && "bg-background text-foreground shadow-sm"
                            )}
                            disabled={isLoading || isSocialLoading !== null}
                        >
                            Inscription
                        </button>
                    </div>
                </CardHeader>

                <CardContent>
                    {mode === "login" ? (
                        // Login Form
                        <form onSubmit={handleLoginSubmit}>
                            <FieldGroup className="gap-3">
                                <Field>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => handleSocialAuth("google")}
                                        disabled={isSocialLoading !== null || isLoading}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path
                                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        {isSocialLoading === "google" ? "Connexion..." : "Connexion avec Google"}
                                    </Button>
                                </Field>
                                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                    Ou
                                </FieldSeparator>
                                <Field>
                                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                                    <Input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        placeholder="m@exemple.com"
                                        required
                                        disabled={isLoading || isSocialLoading !== null}
                                    />
                                </Field>
                                <Field>
                                    <div className="flex items-center justify-between">
                                        <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-sm underline-offset-4 hover:underline"
                                        >
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>
                                    <Input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        required
                                        disabled={isLoading || isSocialLoading !== null}
                                    />
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={isLoading || isSocialLoading !== null}>
                                        {isLoading ? "Connexion..." : "Se connecter"}
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>
                    ) : (
                        // Signup Form with Steps
                        <div>
                            {step === 1 ? (
                                // Step 1: Name, Email and Social
                                <div>
                                    <form onSubmit={handleStep1Submit}>
                                        <FieldGroup className="gap-3">
                                            <Field>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    onClick={() => handleSocialAuth("google")}
                                                    disabled={isSocialLoading !== null || isLoading}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                        <path
                                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                    {isSocialLoading === "google" ? "Inscription..." : "Inscription avec Google"}
                                                </Button>
                                            </Field>
                                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                                Ou
                                            </FieldSeparator>
                                            <Field>
                                                <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                                                <Input
                                                    id="signup-email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="m@exemple.com"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    disabled={isLoading || isSocialLoading !== null}
                                                />
                                                <FieldDescription>
                                                    Nous ne partagerons jamais votre email.
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <Button type="submit" disabled={isLoading || isSocialLoading !== null}>
                                                    Continuer
                                                </Button>
                                            </Field>
                                        </FieldGroup>
                                    </form>
                                </div>
                            ) : (
                                // Step 2: Password
                                <div>
                                    <form onSubmit={handleStep2Submit}>
                                        <FieldGroup className="gap-3">
                                            <div className="flex flex-col items-center gap-2 text-center mb-2">
                                                <h2 className="text-lg font-semibold">Créer un mot de passe</h2>
                                            </div>
                                            <Field>
                                                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    disabled={isLoading || isSocialLoading !== null}
                                                    minLength={12}
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="confirm-password">Confirmer le mot de passe</FieldLabel>
                                                <Input
                                                    id="confirm-password"
                                                    name="confirm-password"
                                                    type="password"
                                                    placeholder="Confirmer le mot de passe"
                                                    required
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    disabled={isLoading || isSocialLoading !== null}
                                                    minLength={12}
                                                />
                                                <FieldDescription>
                                                    12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.
                                                </FieldDescription>
                                            </Field>
                                            <Field>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="flex-shrink-0"
                                                        onClick={() => setStep(1)}
                                                        disabled={isLoading || isSocialLoading !== null}
                                                    >
                                                        <ArrowBigLeftDash className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="submit" className="flex-1" disabled={isLoading || isSocialLoading !== null}>
                                                        {isLoading ? "Création..." : "S'inscrire"}
                                                    </Button>
                                                </div>
                                            </Field>
                                        </FieldGroup>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}