"use client"

import { Book, Menu, Sprout, Sunset, Trees, Zap, CircleUserRound, ChevronsUpDown, UsersRound, LogOut, SquareCheckBig, FlaskConical } from "lucide-react";
import Link from "next/link";

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
import { NavUser } from "@/components/nav-user";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

interface MenuItem {
    title: string;
    url: string;
    description?: string;
    icon?: React.ReactNode;
    items?: MenuItem[];
}

interface Navbar1Props {
    logo?: {
        url: string;
        src: string;
        alt: string;
        title: string;
    };
    menu?: MenuItem[];
    auth?: {
        login: {
            title: string;
            url: string;
        };
        signup: {
            title: string;
            url: string;
        };
    };
}

const Navbar1 = ({
    logo = {
        url: "/",
        src: "",
        alt: "logo",
        title: "PolyCarbone",
    },
    menu = [
        { title: "Mes défis", url: "/challenges", icon: <SquareCheckBig className="size-4" /> },
        { title: "Mes amis", url: "/social", icon: <UsersRound className="size-4" /> },
        { title: "Mon profil", url: "/profile", icon: <CircleUserRound className="size-4" /> },
        { title: "Refaire un bilan carbone", url: "/evaluation", icon: <FlaskConical className="size-4" /> },
    ],
    auth = {
        login: { title: "Login", url: "#" },
        signup: { title: "Sign up", url: "#" },
    },
}: Navbar1Props) => {
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data } = await authClient.getSession();
                setSession(data);
            } catch (error) {
                console.error("Failed to fetch session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, []);

    const handleLogoutSuccess = () => {
        // Mettre à jour la session localement après la déconnexion
        setSession(null);
    };

    return (
        <section className="py-4">
            <div className="container mx-auto">
                {/* Desktop Menu */}
                <nav className="hidden justify-between items-center lg:flex">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <Link href={logo.url} className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                                <Sprout className="size-4" />
                            </div>
                            <span className="text-lg font-semibold tracking-tighter">
                                {logo.title}
                            </span>
                        </Link>
                        <div className="flex items-center">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    {menu.map((item) => renderMenuItem(item))}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {!isLoading && (
                            session?.user ? (
                                <>
                                    <NavUser
                                        user={{
                                            name: session.user.name || "User",
                                            email: session.user.email,
                                            image: session.user.image,
                                        }}
                                        onLogoutSuccess={handleLogoutSuccess}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
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
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={auth.login.url}>{auth.login.title}</Link>
                                    </Button>
                                    <Button asChild size="sm">
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
                        <Link href={logo.url} className="flex items-center">
                            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                                <Sprout className="size-4" />
                            </div>
                            <span className="text-lg font-semibold tracking-tighter ml-2">
                                {logo.title}
                            </span>
                        </Link>

                        {/* User avatar et menu à droite */}
                        <div className="flex items-center gap-2">
                            {!isLoading && session?.user && (
                                <NavUser
                                    user={{
                                        name: session.user.name || "User",
                                        email: session.user.email,
                                        image: session.user.image,
                                    }}
                                    onLogoutSuccess={handleLogoutSuccess}
                                />
                            )}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Menu className="size-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="overflow-y-auto w-[85vw] max-w-sm flex flex-col">
                                    <SheetHeader>
                                        <SheetTitle>
                                            <Link href={logo.url} className="flex items-center gap-2">
                                                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                                                    <Sprout className="size-4" />
                                                </div>
                                                <span className="text-lg font-semibold tracking-tighter">
                                                    {logo.title}
                                                </span>
                                            </Link>
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div className="p-4">
                                            <Accordion
                                                type="single"
                                                collapsible
                                                className="flex w-full flex-col gap-4"
                                            >
                                                {menu.map((item) => renderMobileMenuItem(item))}
                                            </Accordion>
                                        </div>

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
                                                            <Link href={auth.login.url}>{auth.login.title}</Link>
                                                        </Button>
                                                        <Button asChild>
                                                            <Link href={auth.signup.url}>{auth.signup.title}</Link>
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
                className="bg-background dark:bg-black hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors gap-2"
            >
                <span className="flex items-center gap-2">
                    {item.icon}
                    {item.title}
                </span>
            </NavigationMenuLink>
        </NavigationMenuItem>
    );
};

const renderMobileMenuItem = (item: MenuItem) => {
    if (item.items) {
        return (
            <AccordionItem key={item.title} value={item.title} className="border-b-0">
                <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
                    {item.title}
                </AccordionTrigger>
                <AccordionContent className="mt-2">
                    {item.items.map((subItem) => (
                        <SubMenuLink key={subItem.title} item={subItem} />
                    ))}
                </AccordionContent>
            </AccordionItem>
        );
    }

    return (
        <Link key={item.title} href={item.url} className="text-md font-semibold flex items-center gap-2">
            {item.icon}
            {item.title}
        </Link>
    );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
    return (
        <Link
            className="hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
            href={item.url}
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

export { Navbar1 };
