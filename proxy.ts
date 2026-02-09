import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Routes d'authentification (accès uniquement si NON connecté)
const AUTH_ROUTES = ["/auth/portal", "/auth/forgot-password", "/auth/reset-password"];

// Routes d'onboarding (accès uniquement si connecté ET en cours d'onboarding)
const ONBOARDING_ROUTES = ["/onboarding"];

// Routes protégées (accès uniquement si connecté ET onboarding terminé)
const PROTECTED_ROUTES = ["/home", "/profile", "/social", "/challenges", "/evaluation", "/onboarding"];


export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Ignorer les fichiers statiques et les routes API
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".") // fichiers statiques
    ) {
        return NextResponse.next();
    }

    // Vérifier si l'utilisateur a un cookie de session
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const isAuthenticated = !!session?.user;

    // Si l'utilisateur n'est pas authentifié
    if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
        return NextResponse.redirect(new URL("/auth/portal", request.url));
    }

    // Si l'utilisateur est authentifié
    if (isAuthenticated) {
        const onboardingStep = session?.user?.onboardingStep || 0;

        // Si l'onboarding n'est pas terminé (step < 4)
        if (onboardingStep < 4) {
            // Rediriger vers /onboarding pour tous les steps
            if (!pathname.startsWith("/onboarding")) {
                return NextResponse.redirect(new URL("/onboarding", request.url));
            }
        }

        // Si l'utilisateur est connecté et essaie d'accéder à une route d'authentification
        if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
            return NextResponse.redirect(new URL("/challenges", request.url));
        }

        // Si l'onboarding est terminé et l'utilisateur essaie d'accéder à /
        // / est uniquement accessible aux utilisateurs non connectés sinon home est l'équivalent pour les connectés
        if( pathname === "/" ) {
            return NextResponse.redirect(new URL("/home", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};
