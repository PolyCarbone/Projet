"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface OnboardingStatus {
    email: string
    emailVerified: boolean
    username: string | null
    avatarColor: string | null
    onboardingStep: number
    hasCarbonFootprint: boolean
}

interface OnboardingContextType {
    status: OnboardingStatus | null
    isLoading: boolean
    isAuthenticated: boolean
    needsOnboarding: boolean
    refreshStatus: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

// Routes qui ne nécessitent pas de vérification d'onboarding
const EXCLUDED_ROUTES = [
    "/",
    "/auth",
    "/api",
]

// Routes protégées qui nécessitent un onboarding complet
const PROTECTED_ROUTES = [
    "/profile",
    "/social",
    "/challenges",
]

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<OnboardingStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const fetchStatus = async () => {
        try {
            // Vérifier d'abord si l'utilisateur est connecté
            const { data: session } = await authClient.getSession()

            if (!session?.user) {
                setIsAuthenticated(false)
                setStatus(null)
                setIsLoading(false)
                return
            }

            setIsAuthenticated(true)

            // Récupérer le statut d'onboarding
            const response = await fetch("/api/onboarding/status")
            if (response.ok) {
                const data = await response.json()
                setStatus(data)
            }
        } catch (error) {
            console.error("Error fetching onboarding status:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    // Gérer les redirections basées sur l'onboarding
    useEffect(() => {
        if (isLoading) return

        // Ne pas rediriger sur les routes exclues
        const isExcludedRoute = EXCLUDED_ROUTES.some(route =>
            pathname === route || pathname.startsWith(route + "/")
        )

        // Route d'onboarding - ne pas rediriger
        const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/")

        // Route d'évaluation en mode onboarding
        const isEvaluationOnboarding = pathname === "/evaluation" && searchParams.get("onboarding") === "true"

        if (isExcludedRoute || isOnboardingRoute || isEvaluationOnboarding) return

        // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
        const isProtectedRoute = PROTECTED_ROUTES.some(route =>
            pathname === route || pathname.startsWith(route + "/")
        )

        if (!isAuthenticated && isProtectedRoute) {
            router.push("/auth/portal?mode=login")
            return
        }

        // Si l'utilisateur est connecté mais n'a pas terminé l'onboarding
        if (isAuthenticated && status) {
            const needsOnboarding = !status.emailVerified ||
                !status.username ||
                !status.avatarColor ||
                !status.hasCarbonFootprint

            if (needsOnboarding && isProtectedRoute) {
                router.push("/onboarding")
                return
            }

            // Si l'utilisateur tente d'accéder à /evaluation sans onboarding
            if (needsOnboarding && pathname === "/evaluation" && searchParams.get("onboarding") !== "true") {
                router.push("/onboarding")
                return
            }
        }
    }, [isLoading, isAuthenticated, status, pathname, searchParams, router])

    const needsOnboarding = isAuthenticated && status ? (
        !status.emailVerified ||
        !status.username ||
        !status.avatarColor ||
        !status.hasCarbonFootprint
    ) : false

    return (
        <OnboardingContext.Provider
            value={{
                status,
                isLoading,
                isAuthenticated,
                needsOnboarding,
                refreshStatus: fetchStatus,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider")
    }
    return context
}
