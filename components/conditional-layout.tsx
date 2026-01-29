"use client"

import { usePathname } from "next/navigation"
import { TopNavbar } from "@/components/top-navbar"
import { BottomNavbar } from "@/components/bottom-navbar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Pages sans layout (navbar)
    const noLayoutPages = ["/onboarding", "/auth/portal", "/auth/forgot-password", "/auth/reset-password"]
    const shouldHideLayout = noLayoutPages.some(page => pathname?.startsWith(page))

    if (shouldHideLayout) {
        return <>{children}</>
    }

    return (
        <>
            <TopNavbar />
            <BottomNavbar>
                {children}
            </BottomNavbar>
        </>
    )
}
