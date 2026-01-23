"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { authClient } from "@/lib/auth-client"

interface AuthContextType {
    session: any
    isLoading: boolean
    refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchSession = async () => {
        try {
            const { data } = await authClient.getSession()
            setSession(data)
        } catch (error) {
            console.error("Failed to fetch session:", error)
            setSession(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSession()
    }, [])

    return (
        <AuthContext.Provider
            value={{
                session,
                isLoading,
                refreshSession: fetchSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
