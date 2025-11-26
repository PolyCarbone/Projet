import { frenchLocale } from "./auth-locales"

/**
 * Traduit les messages d'erreur de Better Auth en français
 * @param error - L'objet erreur retourné par Better Auth
 * @returns Le message d'erreur traduit en français
 */
export function translateAuthError(error: { message?: string; code?: string; status?: number } | null): string {
    if (!error) return frenchLocale["auth.error.default"]

    // Essayer de mapper par code d'erreur
    const errorCode = error.code?.toLowerCase()
    if (errorCode) {
        const key = `auth.error.${errorCode}` as keyof typeof frenchLocale
        if (key in frenchLocale) {
            return frenchLocale[key]
        }
    }

    // Essayer de mapper par message d'erreur
    const message = error.message?.toLowerCase() || ""

    // Erreurs d'authentification
    if (message.includes("user not found") || message.includes("user doesn't exist")) {
        return frenchLocale["auth.error.user_not_found"]
    }
    if (message.includes("invalid password") || message.includes("incorrect password")) {
        return frenchLocale["auth.error.invalid_password"]
    }
    if (message.includes("invalid credentials")) {
        return frenchLocale["auth.error.invalid_credentials"]
    }
    if (message.includes("invalid email")) {
        return frenchLocale["auth.error.invalid_email"]
    }

    // Erreurs d'inscription
    if (message.includes("email already") || message.includes("already exists")) {
        return frenchLocale["auth.error.email_already_exists"]
    }
    if (message.includes("weak password")) {
        return frenchLocale["auth.error.weak_password"]
    }
    if (message.includes("password") && (message.includes("short") || message.includes("length"))) {
        return frenchLocale["auth.error.password_too_short"]
    }

    // Erreurs de session
    if (message.includes("session expired")) {
        return frenchLocale["auth.error.session_expired"]
    }
    if (message.includes("session") && message.includes("not found")) {
        return frenchLocale["auth.error.session_not_found"]
    }
    if (message.includes("invalid session")) {
        return frenchLocale["auth.error.invalid_session"]
    }

    // Erreurs de vérification
    if (message.includes("token expired")) {
        return frenchLocale["auth.error.token_expired"]
    }
    if (message.includes("invalid token")) {
        return frenchLocale["auth.error.invalid_token"]
    }

    // Erreurs OAuth
    if (message.includes("oauth")) {
        return frenchLocale["auth.error.oauth_failed"]
    }

    // Erreurs par status HTTP
    if (error.status === 401 || error.status === 403) {
        return frenchLocale["auth.error.invalid_credentials"]
    }

    // Message par défaut
    return frenchLocale["auth.error.default"]
}
