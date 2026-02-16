/**
 * Traductions françaises pour Better Auth
 * Basé sur: https://better-auth-ui.com/api-reference/auth-localization
 */
export const frenchLocale = {
    // Messages d'erreur généraux
    "auth.error.default": "Une erreur est survenue",
    "auth.error.unauthorized": "Non autorisé",
    "auth.error.forbidden": "Accès interdit",

    // Erreurs de connexion
    "auth.error.invalid_credentials": "Email ou mot de passe incorrect",
    "auth.error.user_not_found": "Email ou mot de passe incorrect",
    "auth.error.invalid_password": "Email ou mot de passe incorrect",
    "auth.error.invalid_email": "Email ou mot de passe incorrect",

    // Erreurs d'inscription
    "auth.error.email_already_exists": "Cette adresse email est déjà utilisée",
    "auth.error.user_already_exists": "Un compte existe déjà avec cet email",
    "auth.error.weak_password": "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
    "auth.error.password_too_short": "Le mot de passe est trop court",
    "auth.error.password_mismatch": "Les mots de passe ne correspondent pas",

    // Erreurs de session
    "auth.error.session_expired": "Votre session a expiré",
    "auth.error.session_not_found": "Session introuvable",
    "auth.error.invalid_session": "Session invalide",

    // Erreurs de vérification
    "auth.error.verification_failed": "La vérification a échoué",
    "auth.error.invalid_token": "Le lien de vérification est invalide ou a expiré",
    "auth.error.token_expired": "Le lien de vérification a expiré",

    // Erreurs OAuth
    "auth.error.oauth_failed": "La connexion avec le fournisseur a échoué",
    "auth.error.oauth_callback_failed": "Erreur lors du retour de connexion",

    // Messages de succès
    "auth.success.signed_in": "Connexion réussie",
    "auth.success.signed_up": "Compte créé avec succès",
    "auth.success.signed_out": "Déconnexion réussie",
    "auth.success.password_reset": "Mot de passe réinitialisé",

    // Labels de formulaire
    "auth.field.email": "Email",
    "auth.field.password": "Mot de passe",
    "auth.field.name": "Nom",
    "auth.field.confirm_password": "Confirmer le mot de passe",

    // Boutons
    "auth.button.sign_in": "Se connecter",
    "auth.button.sign_up": "S'inscrire",
    "auth.button.sign_out": "Se déconnecter",
    "auth.button.continue": "Continuer",
}
