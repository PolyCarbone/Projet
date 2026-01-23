"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth } from "./auth-context"

interface UserProfile {
    id: string
    name: string
    email: string
    username: string | null
    createdAt: Date | string
    avatar?: {
        id: string
        name: string
        imageUrl: string
    } | null
    avatarBorderColor?: string | null
}

interface UserProfileContextType {
    profile: UserProfile | null
    isLoading: boolean
    refetch: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const { session, isLoading: isAuthLoading } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchProfile = async () => {
        if (!session?.user) {
            setProfile(null)
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/user/profile")
            if (response.ok) {
                const data = await response.json()
                setProfile(data)
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!isAuthLoading) {
            fetchProfile()
        }
    }, [session, isAuthLoading])

    return (
        <UserProfileContext.Provider value={{ profile, isLoading, refetch: fetchProfile }}>
            {children}
        </UserProfileContext.Provider>
    )
}

export function useUserProfile() {
    const context = useContext(UserProfileContext)
    if (context === undefined) {
        throw new Error("useUserProfile must be used within UserProfileProvider")
    }
    return context
}
