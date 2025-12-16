import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Routes d'authentification (accès uniquement si NON connecté)
const AUTH_ROUTES = ["/auth/portal", "/auth/forgot-password", "/auth/reset-password"];

// Routes d'onboarding (accès uniquement si connecté ET en cours d'onboarding)
const ONBOARDING_ROUTES = ["/onboarding"];

// Routes protégées (accès uniquement si connecté ET onboarding terminé)
const PROTECTED_ROUTES = ["/profile", "/social", "/challenges", "/evaluation", "/onboarding"];


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

        // Permettre l'accès à /evaluation pendant l'onboarding
        if (pathname.startsWith("/evaluation")) {
            return NextResponse.next();
        }

        // Si l'onboarding n'est pas terminé (step < 4)
        if (onboardingStep < 4) {
            // Si au step 3, rediriger vers /evaluation pour faire le test carbone
            if (onboardingStep === 3 && !pathname.startsWith("/evaluation") && !pathname.startsWith("/onboarding")) {
                return NextResponse.redirect(new URL("/evaluation?onboarding=true", request.url));
            }
            // Pour les autres steps, rediriger vers /onboarding
            if (!pathname.startsWith("/onboarding")) {
                return NextResponse.redirect(new URL("/onboarding", request.url));
            }
        }

        // Si l'utilisateur est connecté et essaie d'accéder à une route d'authentification
        if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
            return NextResponse.redirect(new URL("/challenges", request.url));
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
