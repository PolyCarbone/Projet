"use client"

import { Home, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { useUserProfile } from "@/lib/user-profile-context";
import { useAuth } from "@/lib/auth-context";

interface BottomNavProps {
    children: React.ReactNode
}

export function BottomNavbar({ children }: BottomNavProps) {
    const pathname = usePathname()
    const { profile } = useUserProfile()
    const { session } = useAuth()

    const navItems = [
        {
            href: "/home",
            label: "Accueil",
            icon: Home,
        },
        {
            href: "/challenges",
            label: "Défis",
            icon: Trophy,
        },
        {
            href: "/social",
            label: "Social",
            icon: Users,
        },
        {
            href: "/team",
            label: "Équipe",
            icon: Users,
        },
    ]

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Main content with padding for mobile bottom nav */}
            <div className={session ? "pb-16 md:pb-0 flex-1 min-h-0 overflow-auto" : "flex-1 min-h-0 overflow-auto"}>
                {children}
            </div>

            {/* Bottom navigation - only visible on mobile when logged in */}
            {session && <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50">
                <div className="grid grid-cols-5 h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center gap-1"
                            >
                                <Icon
                                    className={cn(
                                        "h-6 w-6 transition-colors",
                                        isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-xs transition-colors",
                                        isActive
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}

                    {/* Profile with UserAvatar */}
                    <Link
                        href="/profile"
                        className="flex flex-col items-center justify-center gap-0"
                    >
                        <UserAvatar
                            avatar={profile?.avatar}
                            avatarBorderColor={profile?.avatarBorderColor}
                            username={profile?.username}
                            size="sm"
                            clickable={false}
                            isCurrentUser={true}
                        />
                        <span
                            className={cn(
                                "text-xs transition-colors",
                                pathname === "/profile"
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground"
                            )}
                        >
                            Profil
                        </span>
                    </Link>
                </div>
            </nav>}
        </div>
    )
}
