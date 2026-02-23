"use client"

import { useState } from "react";
import { Menu, CircleUserRound, UsersRound, LogOut, SquareCheckBig, FlaskConical, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/user-profile-context";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { authClient } from "@/lib/auth-client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface MenuItem {
    title: string;
    url: string;
    description?: string;
    icon?: React.ReactNode;
    items?: MenuItem[];
}

const TopNavbar = () => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { session, isLoading } = useAuth();
    const { profile } = useUserProfile();

    const logo = {
        url: "/",
        src: "",
        alt: "logo",
        title: "PolyCarbone",
    };

    const menu = [
        { title: "Mes défis", url: "/challenges", icon: <SquareCheckBig className="size-4 text-white/80" /> },
        { title: "Mes amis", url: "/social", icon: <UsersRound className="size-4 text-white/80" /> },
        { title: "Mon profil", url: "/profile", icon: <CircleUserRound className="size-4 text-white/80" /> },
        { title: "Mon équipe", url: "/team", icon: <UsersRound className="size-4 text-white/80" /> },
        { title: "Refaire un bilan carbone", url: "/evaluation", icon: <FlaskConical className="size-4 text-white/80" /> },
        ...(profile?.isAdmin ? [{ title: "Dashboard Admin", url: "/adminDashboard", icon: <ShieldCheck className="size-4 text-white/80" /> }] : []),

    ];

    const auth = {
        login: { title: "Se connecter", url: "/auth/portal?mode=login" },
        signup: { title: "S'inscrire", url: "/auth/portal?mode=signup" },
    };

    const handleLogoutSuccess = () => {
        // La session sera automatiquement mise à jour par le contexte
        window.location.href = "/";
    };

    return (
        <section className="py-4 bg-primary sticky top-0 z-50">
            <div className="container mx-auto">
                {/* Desktop Menu */}
                <nav className="hidden justify-between items-center lg:flex">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <Link href={logo.url} className="flex items-center gap-2">
                            <Logo className="size-6 text-white" width={24} height={24} />
                            <span className="text-lg font-semibold tracking-tighter text-white">
                                {logo.title}
                            </span>
                        </Link>
                        {!isLoading && session?.user && (
                            <div className="flex items-center">
                                <NavigationMenu>
                                    <NavigationMenuList>
                                        {menu.map((item) => renderMenuItem(item))}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        {!isLoading && (
                            session?.user ? (
                                <>
                                    <div className="text-white/80">
                                        <NotificationsDropdown />
                                    </div>
                                    <UserAvatar
                                        avatar={profile?.avatar}
                                        avatarBorderColor={profile?.avatarBorderColor}
                                        username={profile?.username || session.user.name || "User"}
                                        userId={session.user.id}
                                        size="md"
                                        clickable={true}
                                        isCurrentUser={true}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/15 border border-white/30 hover:border-white/60 transition-colors"
                                        onClick={async () => {
                                            try {
                                                await authClient.signOut()
                                                handleLogoutSuccess()
                                                window.location.href = "/"
                                            } catch (error) {
                                                console.error("Logout failed:", error)
                                            }
                                        }}
                                    >
                                        <LogOut className="size-4" />
                                        Déconnexion
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/15 border border-white/30 hover:border-white/60 transition-colors">
                                        <Link href={auth.login.url}>{auth.login.title}</Link>
                                    </Button>
                                    <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold transition-colors">
                                        <Link href={auth.signup.url}>{auth.signup.title}</Link>
                                    </Button>
                                </>
                            )
                        )}
                    </div>
                </nav>

                {/* Mobile Menu */}
                <div className="block lg:hidden">
                    <div className="relative flex items-center justify-between px-4">
                        {/* Logo à gauche */}
                        <Link href={logo.url} className="flex items-center gap-2">
                            <Logo className="size-6 text-white" width={24} height={24} />
                            <span className="text-lg font-semibold tracking-tighter text-white">
                                {logo.title}
                            </span>
                        </Link>

                        {/* User avatar et menu à droite */}
                        <div className="flex items-center gap-2">
                            {!isLoading && session?.user && (
                                <>
                                    <div className="text-white">
                                        <NotificationsDropdown />
                                    </div>
                                    <UserAvatar
                                        avatar={profile?.avatar}
                                        avatarBorderColor={profile?.avatarBorderColor}
                                        username={profile?.username || session.user.name || "User"}
                                        userId={session.user.id}
                                        size="md"
                                        clickable={true}
                                        isCurrentUser={true}
                                    />
                                </>
                            )}
                            {!isLoading && !session?.user && (
                                <Button asChild>
                                    <Link href={auth.login.url}>{auth.login.title}</Link>
                                </Button>
                            )}
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative hover:bg-white text-white">
                                        <Menu className="size-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="overflow-y-auto w-[85vw] max-w-sm flex flex-col">
                                    <SheetHeader>
                                        <SheetTitle>
                                            <Link href={logo.url} className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                                                <Logo className="size-6" width={24} height={24} />
                                                <span className="text-lg font-semibold tracking-tighter">
                                                    {logo.title}
                                                </span>
                                            </Link>
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col flex-1 justify-between">
                                        {!isLoading && session?.user && (
                                        <div className="p-4">
                                            <Accordion
                                                type="single"
                                                collapsible
                                                className="flex w-full flex-col gap-4"
                                            >
                                                {menu.map((item) => renderMobileMenuItem(item, () => setIsSheetOpen(false)))}
                                            </Accordion>
                                        </div>
                                    )}

                                        {/* Auth section en bas */}
                                        {!isLoading && (
                                            <div className="border-t p-4">
                                                {session?.user ? (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full flex items-center gap-2"
                                                        onClick={async () => {
                                                            try {
                                                                await authClient.signOut()
                                                                handleLogoutSuccess()
                                                                window.location.href = "/"
                                                            } catch (error) {
                                                                console.error("Logout failed:", error)
                                                            }
                                                        }}
                                                    >
                                                        <LogOut className="size-4" />
                                                        Se déconnecter
                                                    </Button>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <Button asChild variant="outline">
                                                            <Link href={auth.login.url} onClick={() => setIsSheetOpen(false)}>{auth.login.title}</Link>
                                                        </Button>
                                                        <Button asChild >
                                                            <Link href={auth.signup.url} onClick={() => setIsSheetOpen(false)}>{auth.signup.title}</Link>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const renderMenuItem = (item: MenuItem) => {
    if (item.items) {
        return (
            <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-popover text-popover-foreground">
                    {item.items.map((subItem) => (
                        <NavigationMenuLink asChild key={subItem.title} className="w-80">
                            <SubMenuLink item={subItem} />
                        </NavigationMenuLink>
                    ))}
                </NavigationMenuContent>
            </NavigationMenuItem>
        );
    }

    return (
        <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
                href={item.url}
                className="text-white/80 hover:text-white hover:bg-white/15 group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors gap-2"
            >
                <span className="flex items-center gap-2 text-white/80 group-hover:text-white">
                    {item.icon}
                    {item.title}
                </span>
            </NavigationMenuLink>
        </NavigationMenuItem>
    );
};

const renderMobileMenuItem = (item: MenuItem, onClose: () => void) => {
    if (item.items) {
        return (
            <AccordionItem key={item.title} value={item.title} className="border-b-0">
                <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
                    {item.title}
                </AccordionTrigger>
                <AccordionContent className="mt-2">
                    {item.items.map((subItem) => (
                        <SubMenuLink key={subItem.title} item={subItem} onClose={onClose} />
                    ))}
                </AccordionContent>
            </AccordionItem>
        );
    }

    return (
        <Link key={item.title} href={item.url} className="text-md font-semibold flex items-center gap-2" onClick={onClose}>
            <span className="text-foreground [&_svg]:text-foreground">{item.icon}</span>
            {item.title}
        </Link>
    );
};

const SubMenuLink = ({ item, onClose }: { item: MenuItem; onClose?: () => void }) => {
    return (
        <Link
            className="hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
            href={item.url}
            onClick={onClose}
        >
            <div className="text-foreground">{item.icon}</div>
            <div>
                <div className="text-sm font-semibold">{item.title}</div>
                {item.description && (
                    <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                    </p>
                )}
            </div>
        </Link>
    );
};

export { TopNavbar };
