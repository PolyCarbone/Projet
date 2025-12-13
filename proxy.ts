import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes d'authentification (accès uniquement si NON connecté)
const AUTH_ROUTES = ["/auth/portal", "/auth/forgot-password", "/auth/reset-password"];

// Routes d'onboarding (accès uniquement si connecté ET en cours d'onboarding)
const ONBOARDING_ROUTES = ["/onboarding"];

// Routes protégées (accès uniquement si connecté ET onboarding terminé)
const PROTECTED_ROUTES = ["/profile", "/social", "/challenges"];

// Routes publiques (accès libre)
const PUBLIC_ROUTES = ["/", "/api"];

// Route d'évaluation - cas spécial: accessible en onboarding avec ?onboarding=true
const EVALUATION_ROUTE = "/evaluation";

export function proxy(request: NextRequest) {
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
    const sessionCookie = request.cookies.get("polycarbone.session_token");
    const isAuthenticated = !!sessionCookie;

    // Route d'authentification
    const isAuthRoute = AUTH_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + "/")
    );

    // Si l'utilisateur est connecté et tente d'accéder à une page d'auth
    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + "/")
    );
    const isOnboardingRoute = ONBOARDING_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + "/")
    );
    const isEvaluationRoute = pathname === EVALUATION_ROUTE || pathname.startsWith(EVALUATION_ROUTE + "/");

    if (!isAuthenticated && (isProtectedRoute || isOnboardingRoute)) {
        return NextResponse.redirect(new URL("/auth/portal?mode=login", request.url));
    }

    // Pour la page d'évaluation en mode onboarding, permettre l'accès
    if (isEvaluationRoute) {
        const isOnboardingMode = request.nextUrl.searchParams.get("onboarding") === "true";

        if (!isAuthenticated && !isOnboardingMode) {
            return NextResponse.redirect(new URL("/auth/portal?mode=login", request.url));
        }

        // En mode onboarding, on laisse passer
        return NextResponse.next();
    }

    // Pour les routes protégées et onboarding, vérifier le statut d'onboarding côté client
    // Le OnboardingProvider gérera les redirections plus fines

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
