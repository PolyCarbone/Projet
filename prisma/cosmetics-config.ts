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
    unlockType?: 'referral' | 'streak' | 'co2_personal' | 'co2_global';
    unlockThreshold?: number;
}

//Selon le nombre de jours consécutifs STREAK (paliers à définir : 2j/4j/1sem/2sem/1mois/2mois/3mois/6mois/1an/2ans)
//Selon le nombre d’amis parrainés (1 ami, 3 amis, 5 amis, 10 amis, 20 amis)
//Selon le nombre de kg de CO2 économisé (50, 100, 150, 200 etc)

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
        unlockType: 'co2_personal',
        unlockThreshold: 20,
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 3',
        imageUrl: '/images/avatars/avatar-3.png',
        unlockType: 'co2_personal',
        unlockThreshold: 50,
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 4',
        imageUrl: '/images/avatars/avatar-4.png',
        unlockType: 'co2_personal',
        unlockThreshold: 100,
        isDefaultAvailable: true,
    },
    {
        type: 'avatar',
        name: 'Avatar 5',
        imageUrl: '/images/avatars/avatar-5.png',
        unlockType: 'co2_personal',
        unlockThreshold: 150,
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 6',
        imageUrl: '/images/avatars/avatar-6.png',
        unlockType: 'co2_personal',
        unlockThreshold: 200,
        isDefaultAvailable: true,
    },
    {
        type: 'avatar',
        name: 'Avatar 7',
        imageUrl: '/images/avatars/avatar-7.png',
        unlockType: 'co2_personal',
        unlockThreshold: 250,
        isDefaultAvailable: false,
    },
    {
        type: 'avatar',
        name: 'Avatar 8',
        imageUrl: '/images/avatars/avatar-8.png',
        unlockType: 'co2_personal',
        unlockThreshold: 300,
        isDefaultAvailable: false,
    },

    // ============================================
    // BORDURES D'AVATAR
    // ============================================
    {
        type: 'border',
        name: 'Bordure Verte',
        colorValue: '#22c55e',
        isDefaultAvailable: true,
    },
    {
        type: 'border',
        name: 'Bordure Bleue',
        colorValue: '#3b82f6',
        isDefaultAvailable: true,
    },
    {
        type: 'border',
        name: 'Bordure Violette',
        colorValue: '#8b5cf6',
        isDefaultAvailable: true,
    },
    {
        type: 'border',
        name: 'Bordure Rose',
        colorValue: '#ec4899',
        unlockType: 'referral',
        unlockThreshold: 1,
    },
    {
        type: 'border',
        name: 'Bordure Orange',
        colorValue: '#f97316',
        isDefaultAvailable: true,
    },
    {
        type: 'border',
        name: 'Bordure Rouge',
        colorValue: '#ef4444',
        unlockType: 'referral',
        unlockThreshold: 2,
    },
    {
        type: 'border',
        name: 'Bordure Jaune',
        colorValue: '#eab308',
        unlockType: 'referral',
        unlockThreshold: 4,
    },
    {
        type: 'border',
        name: 'Bordure Cyan',
        colorValue: '#06b6d4',
        unlockType: 'referral',
        unlockThreshold: 5,
    },
    {
        type: 'border',
        name: 'Bordure Or',
        colorValue: '#fbbf24',
        unlockType: 'referral',
        unlockThreshold: 20,
    },
    {
        type: 'border',
        name: 'Bordure Argent',
        colorValue: '#e5e7eb',
        unlockType: 'referral',
        unlockThreshold: 10,
    },

    // ============================================
    // COULEURS DE PSEUDO
    // ============================================
    {
        type: 'username_color',
        name: 'Pseudo Blanc',
        colorValue: '#f2f2f2',
        isDefaultAvailable: true,
    },
    {
        type: 'username_color',
        name: 'Pseudo Noir',
        colorValue: '#181818',
        isDefaultAvailable: true,
    },
    {
        type: 'username_color',
        name: 'Pseudo Vert',
        colorValue: '#22c55e',
        unlockType: 'streak',
        unlockThreshold: 1,
    },
    {
        type: 'username_color',
        name: 'Pseudo Bleu',
        colorValue: '#3b82f6',
        unlockType: 'streak',
        unlockThreshold: 2,
    },
    {
        type: 'username_color',
        name: 'Pseudo Violet',
        colorValue: '#8b5cf6',
        unlockType: 'streak',
        unlockThreshold: 3,
    },
    {
        type: 'username_color',
        name: 'Pseudo Rose',
        colorValue: '#ec4899',
        unlockType: 'streak',
        unlockThreshold: 4,
    },
    {
        type: 'username_color',
        name: 'Pseudo Orange',
        colorValue: '#f97316',
        unlockType: 'streak',
        unlockThreshold: 5,
    },
    {
        type: 'username_color',
        name: 'Pseudo Rouge',
        colorValue: '#ef4444',
        unlockType: 'streak',
        unlockThreshold: 10,
    },
    {
        type: 'username_color',
        name: 'Pseudo Jaune',
        colorValue: '#eab308',
        unlockType: 'streak',
        unlockThreshold: 14,
    },
    {
        type: 'username_color',
        name: 'Pseudo Cyan',
        colorValue: '#06b6d4',
        unlockType: 'streak',
        unlockThreshold: 21,
    },
    {
        type: 'username_color',
        name: 'Pseudo Or',
        colorValue: '#fbbf24',
        unlockType: 'streak',
        unlockThreshold: 28,
    },

    // ============================================
    // BANNIÈRES DE PROFIL
    // ============================================
    {
        type: 'banner',
        name: 'Bannière verte',
        colorValue: '#079a15',
        isDefaultAvailable: true
    },
    {
        type: 'banner',
        name: 'Bannière jaune',
        colorValue: '#9a9807',
        isDefaultAvailable: true
    },
    {
        type: 'banner',
        name: 'Bannière bleue',
        colorValue: '#075a9a',
        isDefaultAvailable: true
    },
    {
        type: 'banner',
        name: 'Bannière violet',
        colorValue: '#70079a',
        isDefaultAvailable: true
    },
    {
        type: 'banner',
        name: 'Bannière rose',
        colorValue: '#a7357d',
        isDefaultAvailable: true
    },
    {
        type: 'banner',
        name: 'Bannière rouge',
        colorValue: '#9a0707',
        isDefaultAvailable: true
    },
    {
        type: 'banner',
        name: 'Bannière Espace',
        imageUrl: '/images/banners/space.jpg',
        isDefaultAvailable: false
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
 * Obtenir toutes les cosmétiques d'un type spécifique
 */
export function getCosmeticsByType(type: CosmeticConfig['type']): CosmeticConfig[] {
    return COSMETICS_CONFIG.filter((c) => c.type === type);
}
