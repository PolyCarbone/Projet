/**
 * Configuration des cosmétiques par défaut pour l'application
 * Ce fichier définit tous les avatars, bordures, bannières et couleurs disponibles
 */

export interface CosmeticConfig {
    type: 'avatar' | 'border' | 'banner' | 'username_color';
    name: string;
    imageUrl?: string;
    colorValue?: string;
    isDefaultAvailable?: boolean; // Disponible dès l'onboarding
}

export const COSMETICS_CONFIG: CosmeticConfig[] = [
    // ============================================
    // AVATARS - Disponibles à l'onboarding : 1, 4, 6
    // ============================================
    {
        type: 'avatar',
        name: 'Avatar 1',
        imageUrl: '/images/avatars/avatar-1.png',
        isDefaultAvailable: true,
    },
    {
        type: 'avatar',
        name: 'Avatar 2',
        imageUrl: '/images/avatars/avatar-2.png',
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 3',
        imageUrl: '/images/avatars/avatar-3.png',
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 4',
        imageUrl: '/images/avatars/avatar-4.png',
        isDefaultAvailable: true,
    },
    {
        type: 'avatar',
        name: 'Avatar 5',
        imageUrl: '/images/avatars/avatar-5.png',
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 6',
        imageUrl: '/images/avatars/avatar-6.png',
        isDefaultAvailable: true,
    },
    {
        type: 'avatar',
        name: 'Avatar 7',
        imageUrl: '/images/avatars/avatar-7.png',
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 8',
        imageUrl: '/images/avatars/avatar-8.png',
        isDefaultAvailable: false,
    },

    // ============================================
    // BORDURES D'AVATAR
    // ============================================
    {
        type: 'border',
        name: 'Bordure Verte',
        colorValue: '#22c55e',
    },
    {
        type: 'border',
        name: 'Bordure Bleue',
        colorValue: '#3b82f6',
    },
    {
        type: 'border',
        name: 'Bordure Violette',
        colorValue: '#8b5cf6',
    },
    {
        type: 'border',
        name: 'Bordure Rose',
        colorValue: '#ec4899',
    },
    {
        type: 'border',
        name: 'Bordure Orange',
        colorValue: '#f97316',
    },
    {
        type: 'border',
        name: 'Bordure Rouge',
        colorValue: '#ef4444',
    },
    {
        type: 'border',
        name: 'Bordure Jaune',
        colorValue: '#eab308',
    },
    {
        type: 'border',
        name: 'Bordure Cyan',
        colorValue: '#06b6d4',
    },
    {
        type: 'border',
        name: 'Bordure Or',
        colorValue: '#fbbf24',
    },
    {
        type: 'border',
        name: 'Bordure Argent',
        colorValue: '#e5e7eb',
    },

    // ============================================
    // COULEURS DE PSEUDO
    // ============================================
    {
        type: 'username_color',
        name: 'Pseudo Vert',
        colorValue: '#22c55e',
    },
    {
        type: 'username_color',
        name: 'Pseudo Bleu',
        colorValue: '#3b82f6',
    },
    {
        type: 'username_color',
        name: 'Pseudo Violet',
        colorValue: '#8b5cf6',
    },
    {
        type: 'username_color',
        name: 'Pseudo Rose',
        colorValue: '#ec4899',
    },
    {
        type: 'username_color',
        name: 'Pseudo Orange',
        colorValue: '#f97316',
    },
    {
        type: 'username_color',
        name: 'Pseudo Rouge',
        colorValue: '#ef4444',
    },
    {
        type: 'username_color',
        name: 'Pseudo Jaune',
        colorValue: '#eab308',
    },
    {
        type: 'username_color',
        name: 'Pseudo Cyan',
        colorValue: '#06b6d4',
    },
    {
        type: 'username_color',
        name: 'Pseudo Or',
        colorValue: '#fbbf24',
    },

    // ============================================
    // BANNIÈRES DE PROFIL
    // ============================================
    {
        type: 'banner',
        name: 'Bannière Forêt',
        imageUrl: '/images/banners/forest.jpg',
    },
    {
        type: 'banner',
        name: 'Bannière Océan',
        imageUrl: '/images/banners/ocean.jpg',
    },
    {
        type: 'banner',
        name: 'Bannière Montagne',
        imageUrl: '/images/banners/mountain.jpg',
    },
    {
        type: 'banner',
        name: 'Bannière Coucher de Soleil',
        imageUrl: '/images/banners/sunset.jpg',
    },
    {
        type: 'banner',
        name: 'Bannière Espace',
        imageUrl: '/images/banners/space.jpg',
    },
];

/**
 * Obtenir les avatars disponibles à l'onboarding
 */
export function getDefaultAvatars(): CosmeticConfig[] {
    return COSMETICS_CONFIG.filter(
        (c) => c.type === 'avatar' && c.isDefaultAvailable
    );
}

/**
 * Obtenir tous les cosmétiques d'un type spécifique
 */
export function getCosmeticsByType(type: CosmeticConfig['type']): CosmeticConfig[] {
    return COSMETICS_CONFIG.filter((c) => c.type === type);
}
