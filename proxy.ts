import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Routes d'authentification à protéger (empêcher l'accès si connecté)
    const authRoutes = ["/auth/login", "/auth/signup"];

    // Vérifier si l'utilisateur tente d'accéder à une page d'authentification
    if (authRoutes.some(route => pathname.startsWith(route))) {
        // Vérifier si le cookie de session existe
        const sessionCookie = request.cookies.get("polycarbone.session_token");

        // Si l'utilisateur a un cookie de session, le rediriger vers la page d'accueil
        if (sessionCookie) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Laisser continuer la requête normalement
    return NextResponse.next();
}

// Configuration du matcher pour spécifier les routes à intercepter
export const config = {
    matcher: [
        // Matcher pour les routes d'authentification
        "/auth/portal",
        "/auth/forgot-password",
        "/auth/reset-password",
    ],
};
