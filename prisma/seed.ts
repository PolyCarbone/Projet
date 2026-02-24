import 'dotenv/config';
import { PrismaClient, Prisma } from '../lib/generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================
// UTILITAIRES
// ============================================

/** Génère un ID unique */
function genId(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 25);
}

/** Hash un mot de passe au format attendu par better-auth (scrypt) */
async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${derivedKey.toString('hex')}:${salt}`);
        });
    });
}

/** Génère une date dans le passé (N jours en arrière par rapport au 24/02/2026) */
function daysAgo(days: number): Date {
    const d = new Date('2026-02-24T12:00:00.000Z');
    d.setDate(d.getDate() - days);
    return d;
}

/** Génère un code de parrainage aléatoire */
function genReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// ============================================
// CONFIGURATION DES COSMETIQUES
// ============================================

interface CosmeticConfig {
    type: 'avatar' | 'border' | 'banner' | 'username_color';
    name: string;
    imageUrl?: string;
    colorValue?: string;
    isDefaultAvailable?: boolean;
    unlockType?: 'referral' | 'streak' | 'co2_personal' | 'co2_global';
    unlockThreshold?: number;
}

const COSMETICS_CONFIG: CosmeticConfig[] = [
    // AVATARS - Disponibles a l'onboarding : 1, 4, 6
    { type: 'avatar', name: 'Avatar 1', imageUrl: '/images/avatars/avatar-1.png', isDefaultAvailable: true },
    { type: 'avatar', name: 'Avatar 2', imageUrl: '/images/avatars/avatar-2.png', unlockType: 'co2_personal', unlockThreshold: 20, isDefaultAvailable: false },
    { type: 'avatar', name: 'Avatar 3', imageUrl: '/images/avatars/avatar-3.png', unlockType: 'co2_personal', unlockThreshold: 50, isDefaultAvailable: false },
    { type: 'avatar', name: 'Avatar 4', imageUrl: '/images/avatars/avatar-4.png', unlockType: 'co2_personal', unlockThreshold: 100, isDefaultAvailable: true },
    { type: 'avatar', name: 'Avatar 5', imageUrl: '/images/avatars/avatar-5.png', unlockType: 'co2_personal', unlockThreshold: 150, isDefaultAvailable: false },
    { type: 'avatar', name: 'Avatar 6', imageUrl: '/images/avatars/avatar-6.png', unlockType: 'co2_personal', unlockThreshold: 200, isDefaultAvailable: true },
    { type: 'avatar', name: 'Avatar 7', imageUrl: '/images/avatars/avatar-7.png', unlockType: 'co2_personal', unlockThreshold: 250, isDefaultAvailable: false },
    { type: 'avatar', name: 'Avatar 8', imageUrl: '/images/avatars/avatar-8.png', unlockType: 'co2_personal', unlockThreshold: 300, isDefaultAvailable: false },

    // BORDURES D'AVATAR
    { type: 'border', name: 'Bordure Verte', colorValue: '#22c55e', isDefaultAvailable: true },
    { type: 'border', name: 'Bordure Bleue', colorValue: '#3b82f6', isDefaultAvailable: true },
    { type: 'border', name: 'Bordure Violette', colorValue: '#8b5cf6', isDefaultAvailable: true },
    { type: 'border', name: 'Bordure Rose', colorValue: '#ec4899', unlockType: 'referral', unlockThreshold: 1 },
    { type: 'border', name: 'Bordure Orange', colorValue: '#f97316', isDefaultAvailable: true },
    { type: 'border', name: 'Bordure Rouge', colorValue: '#ef4444', unlockType: 'referral', unlockThreshold: 2 },
    { type: 'border', name: 'Bordure Jaune', colorValue: '#eab308', unlockType: 'referral', unlockThreshold: 4 },
    { type: 'border', name: 'Bordure Cyan', colorValue: '#06b6d4', unlockType: 'referral', unlockThreshold: 5 },
    { type: 'border', name: 'Bordure Or', colorValue: '#fbbf24', unlockType: 'referral', unlockThreshold: 20 },
    { type: 'border', name: 'Bordure Argent', colorValue: '#e5e7eb', unlockType: 'referral', unlockThreshold: 10 },

    // COULEURS DE PSEUDO
    { type: 'username_color', name: 'Pseudo Blanc', colorValue: '#f2f2f2', isDefaultAvailable: true },
    { type: 'username_color', name: 'Pseudo Noir', colorValue: '#181818', isDefaultAvailable: true },
    { type: 'username_color', name: 'Pseudo Vert', colorValue: '#22c55e', unlockType: 'streak', unlockThreshold: 1 },
    { type: 'username_color', name: 'Pseudo Bleu', colorValue: '#3b82f6', unlockType: 'streak', unlockThreshold: 2 },
    { type: 'username_color', name: 'Pseudo Violet', colorValue: '#8b5cf6', unlockType: 'streak', unlockThreshold: 3 },
    { type: 'username_color', name: 'Pseudo Rose', colorValue: '#ec4899', unlockType: 'streak', unlockThreshold: 4 },
    { type: 'username_color', name: 'Pseudo Orange', colorValue: '#f97316', unlockType: 'streak', unlockThreshold: 5 },
    { type: 'username_color', name: 'Pseudo Rouge', colorValue: '#ef4444', unlockType: 'streak', unlockThreshold: 10 },
    { type: 'username_color', name: 'Pseudo Jaune', colorValue: '#eab308', unlockType: 'streak', unlockThreshold: 14 },
    { type: 'username_color', name: 'Pseudo Cyan', colorValue: '#06b6d4', unlockType: 'streak', unlockThreshold: 21 },
    { type: 'username_color', name: 'Pseudo Or', colorValue: '#fbbf24', unlockType: 'streak', unlockThreshold: 28 },

    // BANNIERES DE PROFIL
    { type: 'banner', name: 'Banniere verte', colorValue: '#079a15', isDefaultAvailable: true },
    { type: 'banner', name: 'Banniere jaune', colorValue: '#9a9807', isDefaultAvailable: true },
    { type: 'banner', name: 'Banniere bleue', colorValue: '#075a9a', isDefaultAvailable: true },
    { type: 'banner', name: 'Banniere violet', colorValue: '#70079a', isDefaultAvailable: true },
    { type: 'banner', name: 'Banniere rose', colorValue: '#a7357d', isDefaultAvailable: true },
    { type: 'banner', name: 'Banniere rouge', colorValue: '#9a0707', isDefaultAvailable: true },
];

// ============================================
// INTERFACES POUR LES FICHIERS JSON
// ============================================

interface ChallengeConfig {
    id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    co2Impact: number;
    isActive: boolean;
}

interface EventChallengeConfig {
    id: string;
    title: string;
    description: string;
    category: string;
    co2Impact: number;
}

interface EventConfig {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    challenges: EventChallengeConfig[];
}

// ============================================
// DONNÉES UTILISATEURS FICTIFS
// ============================================

const USERS = [
    {
        id: 'user-alice-001',
        name: 'Alice Dupont',
        email: 'alice.dupont@example.com',
        username: 'alice_green',
        onboardingStep: 4,
        createdAt: daysAgo(90),
        totalCO2Saved: 185.5,
        currentStreak: 12,
        longestStreak: 25,
        lastActivityDate: daysAgo(0),
        darkMode: false,
    },
    {
        id: 'user-bob-002',
        name: 'Bob Martin',
        email: 'bob.martin@example.com',
        username: 'bob_eco',
        onboardingStep: 4,
        createdAt: daysAgo(75),
        totalCO2Saved: 142.3,
        currentStreak: 7,
        longestStreak: 18,
        lastActivityDate: daysAgo(0),
        darkMode: true,
    },
    {
        id: 'user-claire-003',
        name: 'Claire Bernard',
        email: 'claire.bernard@example.com',
        username: 'claire_nature',
        onboardingStep: 4,
        createdAt: daysAgo(60),
        totalCO2Saved: 98.7,
        currentStreak: 3,
        longestStreak: 14,
        lastActivityDate: daysAgo(1),
        darkMode: false,
    },
    {
        id: 'user-david-004',
        name: 'David Leroy',
        email: 'david.leroy@example.com',
        username: 'david_velo',
        onboardingStep: 4,
        createdAt: daysAgo(50),
        totalCO2Saved: 210.1,
        currentStreak: 20,
        longestStreak: 30,
        lastActivityDate: daysAgo(0),
        darkMode: true,
    },
    {
        id: 'user-emma-005',
        name: 'Emma Petit',
        email: 'emma.petit@example.com',
        username: 'emma_planete',
        onboardingStep: 4,
        createdAt: daysAgo(45),
        totalCO2Saved: 67.2,
        currentStreak: 0,
        longestStreak: 10,
        lastActivityDate: daysAgo(5),
        darkMode: false,
    },
    {
        id: 'user-francois-006',
        name: 'François Moreau',
        email: 'francois.moreau@example.com',
        username: 'francois_terre',
        onboardingStep: 4,
        createdAt: daysAgo(40),
        totalCO2Saved: 55.8,
        currentStreak: 2,
        longestStreak: 8,
        lastActivityDate: daysAgo(0),
        darkMode: false,
    },
    {
        id: 'user-gabrielle-007',
        name: 'Gabrielle Roux',
        email: 'gabrielle.roux@example.com',
        username: 'gab_eco',
        onboardingStep: 4,
        createdAt: daysAgo(30),
        totalCO2Saved: 310.0,
        currentStreak: 28,
        longestStreak: 28,
        lastActivityDate: daysAgo(0),
        darkMode: true,
    },
    {
        id: 'user-hugo-008',
        name: 'Hugo Garnier',
        email: 'hugo.garnier@example.com',
        username: 'hugo_vert',
        onboardingStep: 2,
        createdAt: daysAgo(10),
        totalCO2Saved: 12.0,
        currentStreak: 1,
        longestStreak: 3,
        lastActivityDate: daysAgo(2),
        darkMode: false,
    },
];

// ============================================
// SEED : COSMÉTIQUES
// ============================================

async function seedCosmetics() {
    console.log('Creation des cosmetiques...');

    for (const cosmetic of COSMETICS_CONFIG) {
        const cosmeticId = `${cosmetic.type}-${cosmetic.name.toLowerCase().replace(/\s+/g, '-')}`;
        await prisma.cosmetic.upsert({
            where: { id: cosmeticId },
            update: {
                type: cosmetic.type,
                name: cosmetic.name,
                imageUrl: cosmetic.imageUrl || null,
                colorValue: cosmetic.colorValue || null,
            },
            create: {
                id: cosmeticId,
                type: cosmetic.type,
                name: cosmetic.name,
                imageUrl: cosmetic.imageUrl || null,
                colorValue: cosmetic.colorValue || null,
            },
        });

        if (cosmetic.unlockType && cosmetic.unlockThreshold !== undefined) {
            await prisma.rewardThreshold.upsert({
                where: {
                    type_threshold: {
                        type: cosmetic.unlockType,
                        threshold: cosmetic.unlockThreshold,
                    },
                },
                update: { cosmeticId, isActive: true },
                create: {
                    type: cosmetic.unlockType,
                    threshold: cosmetic.unlockThreshold,
                    cosmeticId,
                    isActive: true,
                },
            });
        }
    }

    const count = await prisma.cosmetic.count();
    console.log(`   ${count} cosmetiques crees/mis a jour`);
}

// ============================================
// SEED : DÉFIS ET ÉVÉNEMENTS (depuis JSON)
// ============================================

async function seedChallengesAndEvents() {
    console.log('Synchronisation des defis et evenements...');

    const configDir = path.join(__dirname, '..', 'config');
    const challengesData: { challenges: ChallengeConfig[] } = JSON.parse(
        fs.readFileSync(path.join(configDir, 'challenges.json'), 'utf-8'),
    );
    const eventsData: { events: EventConfig[] } = JSON.parse(
        fs.readFileSync(path.join(configDir, 'events.json'), 'utf-8'),
    );

    // Défis standards
    for (const c of challengesData.challenges) {
        await prisma.challenge.upsert({
            where: { id: c.id },
            update: {
                title: c.title,
                description: c.description,
                category: c.category,
                type: c.type,
                co2Impact: c.co2Impact,
                isActive: c.isActive,
            },
            create: {
                id: c.id,
                title: c.title,
                description: c.description,
                category: c.category,
                type: c.type,
                co2Impact: c.co2Impact,
                isActive: c.isActive,
            },
        });
    }
    console.log(`   ${challengesData.challenges.length} defis synchronises`);

    // Événements et leurs défis
    for (const evt of eventsData.events) {
        const event = await prisma.event.upsert({
            where: { id: evt.id },
            update: {
                name: evt.name,
                description: evt.description,
                startDate: new Date(evt.startDate),
                endDate: new Date(evt.endDate),
                isActive: evt.isActive,
            },
            create: {
                id: evt.id,
                name: evt.name,
                description: evt.description,
                startDate: new Date(evt.startDate),
                endDate: new Date(evt.endDate),
                isActive: evt.isActive,
            },
        });

        for (const ch of evt.challenges) {
            await prisma.challenge.upsert({
                where: { id: ch.id },
                update: {
                    title: ch.title,
                    description: ch.description,
                    category: ch.category,
                    type: 'event',
                    co2Impact: ch.co2Impact,
                    isActive: evt.isActive,
                    eventId: event.id,
                },
                create: {
                    id: ch.id,
                    title: ch.title,
                    description: ch.description,
                    category: ch.category,
                    type: 'event',
                    co2Impact: ch.co2Impact,
                    isActive: evt.isActive,
                    eventId: event.id,
                },
            });
        }
    }
    console.log(`   ${eventsData.events.length} evenements synchronises`);
}

// ============================================
// SEED : UTILISATEURS FICTIFS
// ============================================

async function seedUsers() {
    console.log('Creation des utilisateurs fictifs...');

    const passwordHash = await hashPassword('Password123!');

    // Codes de parrainage pour chaque utilisateur
    const referralCodes: Record<string, string> = {};
    for (const u of USERS) {
        referralCodes[u.id] = genReferralCode();
    }

    // Parrainages : Alice → Bob, Claire | David → Emma
    for (const u of USERS) {
        let referredBy: string | null = null;
        if (u.id === 'user-bob-002') referredBy = 'user-alice-001';
        if (u.id === 'user-claire-003') referredBy = 'user-alice-001';
        if (u.id === 'user-emma-005') referredBy = 'user-david-004';

        await prisma.user.upsert({
            where: { id: u.id },
            update: {},
            create: {
                id: u.id,
                name: u.name,
                email: u.email,
                emailVerified: true,
                username: u.username,
                onboardingStep: u.onboardingStep,
                createdAt: u.createdAt,
                updatedAt: u.createdAt,
                totalCO2Saved: u.totalCO2Saved,
                currentStreak: u.currentStreak,
                longestStreak: u.longestStreak,
                lastActivityDate: u.lastActivityDate,
                darkMode: u.darkMode,
                referralCode: referralCodes[u.id],
                referredBy,
                isAdmin: false,
                avatarId: null,
                bannerId: null,
                avatarBorderColor: '#22c55e',
                usernameColor: null,
            },
        });

        // Compte credential pour chaque utilisateur
        await prisma.account.upsert({
            where: { id: `account-${u.id}` },
            update: {},
            create: {
                id: `account-${u.id}`,
                accountId: u.id,
                providerId: 'credential',
                userId: u.id,
                password: passwordHash,
                createdAt: u.createdAt,
                updatedAt: u.createdAt,
            },
        });
    }

    // Assigner les avatars (avatars disponibles à l'onboarding : 1, 4, 6)
    const onboardingAvatarIds = ['avatar-avatar-1', 'avatar-avatar-4', 'avatar-avatar-6'];
    const avatarAssignments: Record<string, string> = {
        'user-alice-001': onboardingAvatarIds[0],
        'user-bob-002': onboardingAvatarIds[1],
        'user-claire-003': onboardingAvatarIds[2],
        'user-david-004': onboardingAvatarIds[0],
        'user-emma-005': onboardingAvatarIds[1],
        'user-francois-006': onboardingAvatarIds[2],
        'user-gabrielle-007': onboardingAvatarIds[0],
        'user-hugo-008': onboardingAvatarIds[1],
    };

    for (const [userId, avatarId] of Object.entries(avatarAssignments)) {
        await prisma.user.update({
            where: { id: userId },
            data: { avatarId },
        });
    }

    // Assigner les bannières individuellement (champ @unique)
    const bannerAssignments: Record<string, string> = {
        'user-alice-001': 'banner-banniere-verte',
        'user-bob-002': 'banner-banniere-bleue',
        'user-claire-003': 'banner-banniere-jaune',
        'user-david-004': 'banner-banniere-violet',
        'user-emma-005': 'banner-banniere-rose',
        'user-francois-006': 'banner-banniere-rouge',
    };

    for (const [userId, bannerId] of Object.entries(bannerAssignments)) {
        const banner = await prisma.cosmetic.findUnique({ where: { id: bannerId } });
        if (banner) {
            const existing = await prisma.user.findFirst({ where: { bannerId } });
            if (!existing) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { bannerId },
                });
            }
        }
    }

    console.log(`   ${USERS.length} utilisateurs crees (mot de passe : Password123!)`);
}

// ============================================
// SEED : EMPREINTE CARBONE
// ============================================

async function seedCarbonFootprints() {
    console.log('Creation des empreintes carbone...');

    const footprints = [
        { userId: 'user-alice-001', total: 6800, transport: 2100, alimentation: 1800, logement: 1500, divers: 900, serviceSocietal: 500 },
        { userId: 'user-bob-002', total: 8200, transport: 3200, alimentation: 2000, logement: 1800, divers: 700, serviceSocietal: 500 },
        { userId: 'user-claire-003', total: 7100, transport: 1800, alimentation: 2200, logement: 1600, divers: 1000, serviceSocietal: 500 },
        { userId: 'user-david-004', total: 5500, transport: 800, alimentation: 1500, logement: 1800, divers: 900, serviceSocietal: 500 },
        { userId: 'user-emma-005', total: 9500, transport: 4000, alimentation: 2500, logement: 1500, divers: 1000, serviceSocietal: 500 },
        { userId: 'user-francois-006', total: 7800, transport: 2800, alimentation: 1900, logement: 1700, divers: 900, serviceSocietal: 500 },
        { userId: 'user-gabrielle-007', total: 4200, transport: 500, alimentation: 1200, logement: 1300, divers: 700, serviceSocietal: 500 },
        { userId: 'user-hugo-008', total: 8800, transport: 3500, alimentation: 2300, logement: 1600, divers: 900, serviceSocietal: 500 },
    ];

    for (const fp of footprints) {
        await prisma.carbonFootprint.upsert({
            where: { userId: fp.userId },
            update: {},
            create: {
                userId: fp.userId,
                totalFootprint: fp.total,
                transport: fp.transport,
                alimentation: fp.alimentation,
                logement: fp.logement,
                divers: fp.divers,
                serviceSocietal: fp.serviceSocietal,
            },
        });
    }

    // Historique : évolution sur plusieurs mois (empreinte diminue avec le temps)
    for (const fp of footprints) {
        const user = USERS.find((u) => u.id === fp.userId);
        if (!user) continue;
        const accountAgeDays = Math.round(
            (new Date('2026-02-24').getTime() - user.createdAt.getTime()) / 86400000,
        );
        const historyPoints = Math.min(Math.floor(accountAgeDays / 30), 3);

        for (let i = historyPoints; i >= 0; i--) {
            const factor = 1 + i * 0.05;
            await prisma.carbonFootprintHistory.create({
                data: {
                    userId: fp.userId,
                    totalFootprint: Math.round(fp.total * factor),
                    transport: fp.transport ? Math.round(fp.transport * factor) : null,
                    alimentation: fp.alimentation ? Math.round(fp.alimentation * factor) : null,
                    logement: fp.logement ? Math.round(fp.logement * factor) : null,
                    divers: fp.divers ? Math.round(fp.divers * factor) : null,
                    serviceSocietal: fp.serviceSocietal ? Math.round(fp.serviceSocietal * factor) : null,
                    createdAt: daysAgo(i * 30),
                },
            });
        }
    }

    console.log(`   ${footprints.length} empreintes carbone + historiques crees`);
}

// ============================================
// SEED : AMITIÉS
// ============================================

async function seedFriendships() {
    console.log('Creation des amities...');

    const friendships = [
        // Amitiés acceptées
        { initiatorId: 'user-alice-001', receiverId: 'user-bob-002', status: 'accepted', createdAt: daysAgo(70) },
        { initiatorId: 'user-alice-001', receiverId: 'user-claire-003', status: 'accepted', createdAt: daysAgo(55) },
        { initiatorId: 'user-alice-001', receiverId: 'user-david-004', status: 'accepted', createdAt: daysAgo(45) },
        { initiatorId: 'user-bob-002', receiverId: 'user-david-004', status: 'accepted', createdAt: daysAgo(40) },
        { initiatorId: 'user-bob-002', receiverId: 'user-emma-005', status: 'accepted', createdAt: daysAgo(35) },
        { initiatorId: 'user-claire-003', receiverId: 'user-francois-006', status: 'accepted', createdAt: daysAgo(30) },
        { initiatorId: 'user-david-004', receiverId: 'user-gabrielle-007', status: 'accepted', createdAt: daysAgo(25) },
        { initiatorId: 'user-emma-005', receiverId: 'user-francois-006', status: 'accepted', createdAt: daysAgo(20) },
        { initiatorId: 'user-gabrielle-007', receiverId: 'user-alice-001', status: 'accepted', createdAt: daysAgo(15) },
        { initiatorId: 'user-francois-006', receiverId: 'user-david-004', status: 'accepted', createdAt: daysAgo(12) },
        // Demandes en attente
        { initiatorId: 'user-hugo-008', receiverId: 'user-alice-001', status: 'pending', createdAt: daysAgo(3) },
        { initiatorId: 'user-hugo-008', receiverId: 'user-bob-002', status: 'pending', createdAt: daysAgo(2) },
        // Demande refusée
        { initiatorId: 'user-emma-005', receiverId: 'user-gabrielle-007', status: 'rejected', createdAt: daysAgo(18) },
    ];

    for (const f of friendships) {
        await prisma.friendship.upsert({
            where: {
                initiatorId_receiverId: {
                    initiatorId: f.initiatorId,
                    receiverId: f.receiverId,
                },
            },
            update: {},
            create: {
                initiatorId: f.initiatorId,
                receiverId: f.receiverId,
                status: f.status,
                createdAt: f.createdAt,
                updatedAt: f.createdAt,
            },
        });
    }

    console.log(`   ${friendships.length} relations d'amitie creees`);
}

// ============================================
// SEED : DÉFIS UTILISATEURS
// ============================================

async function seedUserChallenges() {
    console.log('Attribution des defis aux utilisateurs...');

    const userChallenges: Array<{
        userId: string;
        challengeId: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        co2Saved: number | null;
    }> = [
            // ════════════════════════════════════════════════════════
            // J-30 à J-26 — Début : Alice + David seulement (~2-3/j)
            // ════════════════════════════════════════════════════════
            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(30), completedAt: daysAgo(30), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(30), completedAt: daysAgo(30), co2Saved: 1.5 },

            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(29), completedAt: daysAgo(29), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(29), completedAt: daysAgo(29), co2Saved: 2.5 },

            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(28), completedAt: daysAgo(28), co2Saved: 0.8 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(28), completedAt: daysAgo(28), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(28), completedAt: daysAgo(28), co2Saved: 1.0 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(27), completedAt: daysAgo(27), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(27), completedAt: daysAgo(27), co2Saved: 0.6 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(27), completedAt: daysAgo(27), co2Saved: 0.4 },

            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(26), completedAt: daysAgo(26), co2Saved: 1.0 },
            { userId: 'user-alice-001', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(26), completedAt: daysAgo(26), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(26), completedAt: daysAgo(26), co2Saved: 2.5 },

            // ════════════════════════════════════════════════════════
            // J-25 à J-21 — Bob rejoint (~5-7/j, 3 utilisateurs)
            // ════════════════════════════════════════════════════════
            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(25), completedAt: daysAgo(25), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(25), completedAt: daysAgo(25), co2Saved: 1.5 },
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(25), completedAt: daysAgo(25), co2Saved: 1.8 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(24), completedAt: daysAgo(24), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(24), completedAt: daysAgo(24), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(24), completedAt: daysAgo(24), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(24), completedAt: daysAgo(24), co2Saved: 0.3 },

            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(23), completedAt: daysAgo(23), co2Saved: 0.8 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(23), completedAt: daysAgo(23), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(23), completedAt: daysAgo(23), co2Saved: 1.0 },
            { userId: 'user-bob-002', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(23), completedAt: daysAgo(23), co2Saved: 1.2 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(22), completedAt: daysAgo(22), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(22), completedAt: daysAgo(22), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(22), completedAt: daysAgo(22), co2Saved: 0.4 },
            { userId: 'user-bob-002', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(22), completedAt: daysAgo(22), co2Saved: 0.6 },

            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(21), completedAt: daysAgo(21), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(21), completedAt: daysAgo(21), co2Saved: 1.0 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(21), completedAt: daysAgo(21), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(21), completedAt: daysAgo(21), co2Saved: 2.0 },
            { userId: 'user-bob-002', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(21), completedAt: daysAgo(21), co2Saved: 0.2 },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(21), completedAt: daysAgo(21), co2Saved: 1.5 },

            // ════════════════════════════════════════════════════════
            // J-20 à J-16 — Claire rejoint (~9-12/j, 4 utilisateurs)
            // ════════════════════════════════════════════════════════
            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 0.8 },
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 1.8 },
            { userId: 'user-bob-002', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 0.4 },
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(20), completedAt: daysAgo(20), co2Saved: 1.5 },

            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 0.8 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 1.2 },
            { userId: 'user-bob-002', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 0.6 },
            { userId: 'user-claire-003', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(19), completedAt: daysAgo(19), co2Saved: 0.1 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 1.0 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 1.0 },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 1.5 },
            { userId: 'user-bob-002', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 0.4 },
            { userId: 'user-claire-003', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(18), completedAt: daysAgo(18), co2Saved: 1.0 },

            { userId: 'user-alice-001', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 0.6 },
            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 0.4 },
            { userId: 'user-bob-002', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 1.2 },
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 1.5 },
            { userId: 'user-claire-003', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(17), completedAt: daysAgo(17), co2Saved: 2.0 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 0.4 },
            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 0.8 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 0.8 },
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 1.8 },
            { userId: 'user-bob-002', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 0.2 },
            { userId: 'user-claire-003', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 2.5 },
            { userId: 'user-claire-003', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(16), completedAt: daysAgo(16), co2Saved: 0.8 },

            // ════════════════════════════════════════════════════════
            // J-15 à J-11 — Gabrielle + François rejoignent (~14-18/j, 6 util.)
            // ════════════════════════════════════════════════════════
            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 1.0 },
            { userId: 'user-alice-001', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 0.6 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 0.3 },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 1.5 },
            { userId: 'user-bob-002', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 1.5 },
            { userId: 'user-claire-003', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 0.6 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 2.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 1.5 },
            { userId: 'user-francois-006', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(15), completedAt: daysAgo(15), co2Saved: 0.6 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 1.8 },
            { userId: 'user-bob-002', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 1.2 },
            { userId: 'user-claire-003', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 0.4 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 0.8 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 0.6 },
            { userId: 'user-francois-006', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(14), completedAt: daysAgo(14), co2Saved: 1.2 },

            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 0.8 },
            { userId: 'user-alice-001', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 1.0 },
            { userId: 'user-david-004', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 2.0 },
            { userId: 'user-bob-002', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 0.3 },
            { userId: 'user-bob-002', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 0.2 },
            { userId: 'user-claire-003', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 0.1 },
            { userId: 'user-claire-003', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 1.0 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 0.4 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 1.0 },
            { userId: 'user-francois-006', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(13), completedAt: daysAgo(13), co2Saved: 1.5 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 0.3 },
            { userId: 'user-david-004', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 0.8 },
            { userId: 'user-david-004', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 1.2 },
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 1.8 },
            { userId: 'user-bob-002', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 0.4 },
            { userId: 'user-claire-003', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 2.5 },
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 1.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 0.3 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 2.0 },
            { userId: 'user-francois-006', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 1.0 },
            { userId: 'user-francois-006', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(12), completedAt: daysAgo(12), co2Saved: 0.4 },

            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 1.0 },
            { userId: 'user-alice-001', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.2 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.6 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.4 },
            { userId: 'user-bob-002', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 2.5 },
            { userId: 'user-bob-002', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.8 },
            { userId: 'user-bob-002', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 2.0 },
            { userId: 'user-claire-003', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.6 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 2.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 1.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.1 },
            { userId: 'user-francois-006', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 2.5 },
            { userId: 'user-francois-006', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(11), completedAt: daysAgo(11), co2Saved: 0.8 },

            // ════════════════════════════════════════════════════════
            // J-10 à J-6 — Emma + Hugo rejoignent (~20-26/j, 8 util.)
            // ════════════════════════════════════════════════════════
            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 2.0 },
            { userId: 'user-alice-001', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.1 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 1.0 },
            { userId: 'user-david-004', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.2 },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 1.5 },
            { userId: 'user-bob-002', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 1.0 },
            { userId: 'user-claire-003', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 2.0 },
            { userId: 'user-claire-003', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.3 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.8 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 1.0 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.6 },
            { userId: 'user-francois-006', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 1.5 },
            { userId: 'user-francois-006', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 2.0 },
            { userId: 'user-emma-005', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 1.8 },
            { userId: 'user-emma-005', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(10), completedAt: daysAgo(10), co2Saved: 0.4 },

            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.4 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.0 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.8 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.8 },
            { userId: 'user-bob-002', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.2 },
            { userId: 'user-bob-002', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.4 },
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.5 },
            { userId: 'user-claire-003', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 2.5 },
            { userId: 'user-claire-003', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.0 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 2.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.8 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.6 },
            { userId: 'user-francois-006', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.2 },
            { userId: 'user-francois-006', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.0 },
            { userId: 'user-francois-006', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.5 },
            { userId: 'user-emma-005', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 1.8 },
            { userId: 'user-emma-005', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.4 },
            { userId: 'user-hugo-008', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(9), completedAt: daysAgo(9), co2Saved: 0.4 },

            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.8 },
            { userId: 'user-alice-001', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.6 },
            { userId: 'user-alice-001', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.3 },
            { userId: 'user-alice-001', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.3 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 1.0 },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 1.5 },
            { userId: 'user-bob-002', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.8 },
            { userId: 'user-bob-002', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.2 },
            { userId: 'user-claire-003', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.4 },
            { userId: 'user-claire-003', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.1 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.4 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 1.0 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.3 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 2.0 },
            { userId: 'user-francois-006', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.6 },
            { userId: 'user-francois-006', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.4 },
            { userId: 'user-francois-006', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.8 },
            { userId: 'user-emma-005', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 1.5 },
            { userId: 'user-emma-005', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 0.8 },
            { userId: 'user-hugo-008', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(8), completedAt: daysAgo(8), co2Saved: 1.5 },

            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.0 },
            { userId: 'user-alice-001', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.2 },
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.1 },
            { userId: 'user-bob-002', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.5 },
            { userId: 'user-bob-002', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.0 },
            { userId: 'user-bob-002', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.1 },
            { userId: 'user-bob-002', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.0 },
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.5 },
            { userId: 'user-claire-003', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.6 },
            { userId: 'user-claire-003', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.2 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.8 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.1 },
            { userId: 'user-francois-006', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.5 },
            { userId: 'user-francois-006', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.5 },
            { userId: 'user-francois-006', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 2.0 },
            { userId: 'user-emma-005', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.8 },
            { userId: 'user-emma-005', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 1.2 },
            { userId: 'user-emma-005', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.1 },
            { userId: 'user-hugo-008', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(7), completedAt: daysAgo(7), co2Saved: 0.8 },

            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.4 },
            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.8 },
            { userId: 'user-alice-001', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.6 },
            { userId: 'user-alice-001', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.1 },
            { userId: 'user-david-004', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.8 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.6 },
            { userId: 'user-david-004', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.2 },
            { userId: 'user-david-004', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 1.2 },
            { userId: 'user-bob-002', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.4 },
            { userId: 'user-bob-002', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.3 },
            { userId: 'user-bob-002', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.8 },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 1.5 },
            { userId: 'user-claire-003', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 2.5 },
            { userId: 'user-claire-003', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 2.0 },
            { userId: 'user-claire-003', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.3 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.4 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.6 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.2 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.3 },
            { userId: 'user-francois-006', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.4 },
            { userId: 'user-francois-006', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.2 },
            { userId: 'user-francois-006', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.1 },
            { userId: 'user-emma-005', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.4 },
            { userId: 'user-emma-005', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 2.0 },
            { userId: 'user-emma-005', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.2 },
            { userId: 'user-hugo-008', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.6 },
            { userId: 'user-hugo-008', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(6), completedAt: daysAgo(6), co2Saved: 0.1 },

            // ════════════════════════════════════════════════════════
            // J-5 à J-0 — Pic d'activité (~28-35/j)
            // ════════════════════════════════════════════════════════
            // ── Alice — très active ──
            { userId: 'user-alice-001', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 2.5 },
            { userId: 'user-alice-001', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 1.5 },
            { userId: 'user-alice-001', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.8 },
            { userId: 'user-alice-001', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 0.4 },
            { userId: 'user-alice-001', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(2), completedAt: daysAgo(2), co2Saved: 2.0 },
            { userId: 'user-alice-001', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(1), completedAt: daysAgo(1), co2Saved: 1.0 },
            { userId: 'user-alice-001', challengeId: 'annual-vegetarian', status: 'active', startedAt: daysAgo(4), completedAt: null, co2Saved: null },
            { userId: 'user-alice-001', challengeId: 'daily-public-transport', status: 'active', startedAt: daysAgo(1), completedAt: null, co2Saved: null },

            // ── Bob — actif ──
            { userId: 'user-bob-002', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 1.8 },
            { userId: 'user-bob-002', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 1.2 },
            { userId: 'user-bob-002', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.6 },
            { userId: 'user-bob-002', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 0.3 },
            { userId: 'user-bob-002', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(2), completedAt: daysAgo(2), co2Saved: 0.2 },
            { userId: 'user-bob-002', challengeId: 'annual-composting', status: 'active', startedAt: daysAgo(5), completedAt: null, co2Saved: null },
            { userId: 'user-bob-002', challengeId: 'daily-vegetarian-meal', status: 'active', startedAt: daysAgo(1), completedAt: null, co2Saved: null },

            // ── Claire ──
            { userId: 'user-claire-003', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 1.5 },
            { userId: 'user-claire-003', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 0.8 },
            { userId: 'user-claire-003', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.1 },
            { userId: 'user-claire-003', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 1.0 },
            { userId: 'user-claire-003', challengeId: 'daily-bike-commute', status: 'skipped', startedAt: daysAgo(2), completedAt: null, co2Saved: null },
            { userId: 'user-claire-003', challengeId: 'daily-short-shower', status: 'active', startedAt: daysAgo(1), completedAt: null, co2Saved: null },

            // ── David — le plus performant ──
            { userId: 'user-david-004', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 2.5 },
            { userId: 'user-david-004', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 1.5 },
            { userId: 'user-david-004', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.6 },
            { userId: 'user-david-004', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.4 },
            { userId: 'user-david-004', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 0.3 },
            { userId: 'user-david-004', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 1.0 },
            { userId: 'user-david-004', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(2), completedAt: daysAgo(2), co2Saved: 2.0 },
            { userId: 'user-david-004', challengeId: 'annual-bike-purchase', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(1), co2Saved: 500 },
            { userId: 'user-david-004', challengeId: 'annual-no-plane', status: 'active', startedAt: daysAgo(5), completedAt: null, co2Saved: null },
            { userId: 'user-david-004', challengeId: 'daily-local-food', status: 'active', startedAt: daysAgo(0), completedAt: null, co2Saved: null },

            // ── Emma — moins active ──
            { userId: 'user-emma-005', challengeId: 'daily-public-transport', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 1.8 },
            { userId: 'user-emma-005', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.4 },
            { userId: 'user-emma-005', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 0.1 },
            { userId: 'user-emma-005', challengeId: 'daily-carpool', status: 'skipped', startedAt: daysAgo(2), completedAt: null, co2Saved: null },
            { userId: 'user-emma-005', challengeId: 'daily-digital-cleanup', status: 'proposed', startedAt: daysAgo(1), completedAt: null, co2Saved: null },

            // ── François ──
            { userId: 'user-francois-006', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 0.6 },
            { userId: 'user-francois-006', challengeId: 'daily-carpool', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 1.2 },
            { userId: 'user-francois-006', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 1.0 },
            { userId: 'user-francois-006', challengeId: 'daily-vegetarian-meal', status: 'active', startedAt: daysAgo(1), completedAt: null, co2Saved: null },

            // ── Gabrielle — la plus impliquée ──
            { userId: 'user-gabrielle-007', challengeId: 'daily-bike-commute', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 2.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-vegetarian-meal', status: 'completed', startedAt: daysAgo(5), completedAt: daysAgo(5), co2Saved: 1.5 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-local-food', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.8 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-food-waste', status: 'completed', startedAt: daysAgo(4), completedAt: daysAgo(4), co2Saved: 0.6 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 0.4 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-temperature-reduction', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 1.0 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-unplug-devices', status: 'completed', startedAt: daysAgo(2), completedAt: daysAgo(2), co2Saved: 0.3 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-no-new-purchase', status: 'completed', startedAt: daysAgo(2), completedAt: daysAgo(2), co2Saved: 2.0 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-digital-cleanup', status: 'completed', startedAt: daysAgo(1), completedAt: daysAgo(1), co2Saved: 0.2 },
            { userId: 'user-gabrielle-007', challengeId: 'daily-reusable-bags', status: 'completed', startedAt: daysAgo(1), completedAt: daysAgo(1), co2Saved: 0.1 },
            { userId: 'user-gabrielle-007', challengeId: 'annual-vegan', status: 'active', startedAt: daysAgo(5), completedAt: null, co2Saved: null },
            { userId: 'user-gabrielle-007', challengeId: 'daily-public-transport', status: 'active', startedAt: daysAgo(0), completedAt: null, co2Saved: null },

            // ── Hugo — débutant ──
            { userId: 'user-hugo-008', challengeId: 'daily-short-shower', status: 'completed', startedAt: daysAgo(3), completedAt: daysAgo(3), co2Saved: 0.4 },
            { userId: 'user-hugo-008', challengeId: 'daily-reusable-bags', status: 'proposed', startedAt: daysAgo(1), completedAt: null, co2Saved: null },
        ];

    for (const uc of userChallenges) {
        await prisma.userChallenge.create({
            data: {
                userId: uc.userId,
                challengeId: uc.challengeId,
                status: uc.status,
                startedAt: uc.startedAt,
                completedAt: uc.completedAt,
                co2Saved: uc.co2Saved,
            },
        });
    }

    console.log(`   ${userChallenges.length} defis utilisateurs crees`);
}

// ============================================
// SEED : COSMÉTIQUES DÉBLOQUÉS
// ============================================

async function seedUserCosmetics() {
    console.log('Deblocage de cosmetiques pour les utilisateurs...');

    const unlocks: Array<{ userId: string; cosmeticId: string; source: string; unlockedAt: Date }> = [
        // ── Alice (185.5 kg CO2, streak max 25, 2 parrainages) ──
        { userId: 'user-alice-001', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(90) },
        { userId: 'user-alice-001', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(70) },
        { userId: 'user-alice-001', cosmeticId: 'avatar-avatar-3', source: 'co2_personal', unlockedAt: daysAgo(50) },
        { userId: 'user-alice-001', cosmeticId: 'avatar-avatar-4', source: 'co2_personal', unlockedAt: daysAgo(35) },
        { userId: 'user-alice-001', cosmeticId: 'avatar-avatar-5', source: 'co2_personal', unlockedAt: daysAgo(20) },
        { userId: 'user-alice-001', cosmeticId: 'border-bordure-rose', source: 'referral', unlockedAt: daysAgo(75) },
        { userId: 'user-alice-001', cosmeticId: 'border-bordure-rouge', source: 'referral', unlockedAt: daysAgo(55) },
        { userId: 'user-alice-001', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(90) },
        { userId: 'user-alice-001', cosmeticId: 'banner-banniere-verte', source: 'co2_personal', unlockedAt: daysAgo(90) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-vert', source: 'streak', unlockedAt: daysAgo(80) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-bleu', source: 'streak', unlockedAt: daysAgo(70) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-violet', source: 'streak', unlockedAt: daysAgo(60) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-rose', source: 'streak', unlockedAt: daysAgo(55) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-orange', source: 'streak', unlockedAt: daysAgo(50) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-rouge', source: 'streak', unlockedAt: daysAgo(40) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-jaune', source: 'streak', unlockedAt: daysAgo(35) },
        { userId: 'user-alice-001', cosmeticId: 'username_color-pseudo-cyan', source: 'streak', unlockedAt: daysAgo(30) },

        // ── Bob (142.3 kg CO2, streak max 18) ──
        { userId: 'user-bob-002', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(75) },
        { userId: 'user-bob-002', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(55) },
        { userId: 'user-bob-002', cosmeticId: 'avatar-avatar-3', source: 'co2_personal', unlockedAt: daysAgo(35) },
        { userId: 'user-bob-002', cosmeticId: 'avatar-avatar-4', source: 'co2_personal', unlockedAt: daysAgo(20) },
        { userId: 'user-bob-002', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(75) },
        { userId: 'user-bob-002', cosmeticId: 'banner-banniere-bleue', source: 'co2_personal', unlockedAt: daysAgo(75) },
        { userId: 'user-bob-002', cosmeticId: 'username_color-pseudo-vert', source: 'streak', unlockedAt: daysAgo(60) },
        { userId: 'user-bob-002', cosmeticId: 'username_color-pseudo-bleu', source: 'streak', unlockedAt: daysAgo(50) },
        { userId: 'user-bob-002', cosmeticId: 'username_color-pseudo-violet', source: 'streak', unlockedAt: daysAgo(45) },

        // ── Claire (98.7 kg CO2, streak max 14) ──
        { userId: 'user-claire-003', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(60) },
        { userId: 'user-claire-003', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(40) },
        { userId: 'user-claire-003', cosmeticId: 'avatar-avatar-3', source: 'co2_personal', unlockedAt: daysAgo(20) },
        { userId: 'user-claire-003', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(60) },
        { userId: 'user-claire-003', cosmeticId: 'banner-banniere-jaune', source: 'co2_personal', unlockedAt: daysAgo(60) },
        { userId: 'user-claire-003', cosmeticId: 'username_color-pseudo-vert', source: 'streak', unlockedAt: daysAgo(50) },

        // ── David (210.1 kg CO2, streak max 30, 1 parrainage) ──
        { userId: 'user-david-004', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(50) },
        { userId: 'user-david-004', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(40) },
        { userId: 'user-david-004', cosmeticId: 'avatar-avatar-3', source: 'co2_personal', unlockedAt: daysAgo(30) },
        { userId: 'user-david-004', cosmeticId: 'avatar-avatar-4', source: 'co2_personal', unlockedAt: daysAgo(22) },
        { userId: 'user-david-004', cosmeticId: 'avatar-avatar-5', source: 'co2_personal', unlockedAt: daysAgo(15) },
        { userId: 'user-david-004', cosmeticId: 'avatar-avatar-6', source: 'co2_personal', unlockedAt: daysAgo(8) },
        { userId: 'user-david-004', cosmeticId: 'border-bordure-rose', source: 'referral', unlockedAt: daysAgo(45) },
        { userId: 'user-david-004', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(50) },
        { userId: 'user-david-004', cosmeticId: 'banner-banniere-violet', source: 'co2_personal', unlockedAt: daysAgo(50) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-vert', source: 'streak', unlockedAt: daysAgo(45) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-bleu', source: 'streak', unlockedAt: daysAgo(40) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-violet', source: 'streak', unlockedAt: daysAgo(38) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-rose', source: 'streak', unlockedAt: daysAgo(36) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-orange', source: 'streak', unlockedAt: daysAgo(34) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-rouge', source: 'streak', unlockedAt: daysAgo(28) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-jaune', source: 'streak', unlockedAt: daysAgo(22) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-cyan', source: 'streak', unlockedAt: daysAgo(18) },
        { userId: 'user-david-004', cosmeticId: 'username_color-pseudo-or', source: 'streak', unlockedAt: daysAgo(10) },

        // ── Emma (67.2 kg CO2, streak max 10) ──
        { userId: 'user-emma-005', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(45) },
        { userId: 'user-emma-005', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(25) },
        { userId: 'user-emma-005', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(45) },
        { userId: 'user-emma-005', cosmeticId: 'banner-banniere-rose', source: 'co2_personal', unlockedAt: daysAgo(45) },

        // ── François (55.8 kg CO2, streak max 8) ──
        { userId: 'user-francois-006', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(40) },
        { userId: 'user-francois-006', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(20) },
        { userId: 'user-francois-006', cosmeticId: 'avatar-avatar-3', source: 'co2_personal', unlockedAt: daysAgo(5) },
        { userId: 'user-francois-006', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(40) },
        { userId: 'user-francois-006', cosmeticId: 'banner-banniere-rouge', source: 'co2_personal', unlockedAt: daysAgo(40) },

        // ── Gabrielle (310 kg CO2, streak max 28) ──
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(30) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-2', source: 'co2_personal', unlockedAt: daysAgo(25) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-3', source: 'co2_personal', unlockedAt: daysAgo(22) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-4', source: 'co2_personal', unlockedAt: daysAgo(18) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-5', source: 'co2_personal', unlockedAt: daysAgo(14) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-6', source: 'co2_personal', unlockedAt: daysAgo(10) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-7', source: 'co2_personal', unlockedAt: daysAgo(5) },
        { userId: 'user-gabrielle-007', cosmeticId: 'avatar-avatar-8', source: 'co2_personal', unlockedAt: daysAgo(2) },
        { userId: 'user-gabrielle-007', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(30) },
        { userId: 'user-gabrielle-007', cosmeticId: 'banner-banniere-verte', source: 'co2_personal', unlockedAt: daysAgo(30) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-vert', source: 'streak', unlockedAt: daysAgo(28) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-bleu', source: 'streak', unlockedAt: daysAgo(26) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-violet', source: 'streak', unlockedAt: daysAgo(24) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-rose', source: 'streak', unlockedAt: daysAgo(22) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-orange', source: 'streak', unlockedAt: daysAgo(20) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-rouge', source: 'streak', unlockedAt: daysAgo(16) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-jaune', source: 'streak', unlockedAt: daysAgo(12) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-cyan', source: 'streak', unlockedAt: daysAgo(8) },
        { userId: 'user-gabrielle-007', cosmeticId: 'username_color-pseudo-or', source: 'streak', unlockedAt: daysAgo(3) },

        // ── Hugo (12 kg CO2, débutant) ──
        { userId: 'user-hugo-008', cosmeticId: 'avatar-avatar-1', source: 'co2_personal', unlockedAt: daysAgo(10) },
        { userId: 'user-hugo-008', cosmeticId: 'border-bordure-verte', source: 'co2_personal', unlockedAt: daysAgo(10) },
    ];

    for (const u of unlocks) {
        const exists = await prisma.cosmetic.findUnique({ where: { id: u.cosmeticId } });
        if (!exists) {
            console.warn(`   Cosmetique ${u.cosmeticId} introuvable, ignore`);
            continue;
        }
        await prisma.userCosmetic.upsert({
            where: { userId_cosmeticId: { userId: u.userId, cosmeticId: u.cosmeticId } },
            update: {},
            create: {
                userId: u.userId,
                cosmeticId: u.cosmeticId,
                source: u.source,
                unlockedAt: u.unlockedAt,
            },
        });
    }

    console.log(`   ${unlocks.length} cosmetiques debloquees`);
}

// ============================================
// SEED : ÉQUIPES
// ============================================

async function seedTeams() {
    console.log('Creation des equipes...');

    // Équipe 1 : Les Écolos — créée par Alice
    const team1 = await prisma.team.upsert({
        where: { id: 'team-ecolos-001' },
        update: {},
        create: {
            id: 'team-ecolos-001',
            name: 'Les Écolos',
            description: 'Ensemble pour réduire notre empreinte carbone !',
            creatorId: 'user-alice-001',
            totalCO2Saved: 536.5,
            createdAt: daysAgo(65),
            updatedAt: daysAgo(0),
        },
    });

    // Équipe 2 : Vélo Club — créée par David
    const team2 = await prisma.team.upsert({
        where: { id: 'team-velo-002' },
        update: {},
        create: {
            id: 'team-velo-002',
            name: 'Vélo Club Carbone',
            description: 'On pedale pour la planete',
            creatorId: 'user-david-004',
            totalCO2Saved: 322.3,
            createdAt: daysAgo(35),
            updatedAt: daysAgo(0),
        },
    });

    // Membres équipe 1
    const team1Members = [
        { userId: 'user-alice-001', role: 'admin', status: 'accepted', joinedAt: daysAgo(65) },
        { userId: 'user-bob-002', role: 'member', status: 'accepted', joinedAt: daysAgo(60) },
        { userId: 'user-claire-003', role: 'member', status: 'accepted', joinedAt: daysAgo(50) },
        { userId: 'user-emma-005', role: 'member', status: 'accepted', joinedAt: daysAgo(40) },
        { userId: 'user-hugo-008', role: 'member', status: 'pending', joinedAt: daysAgo(3) },
    ];

    // Membres équipe 2
    const team2Members = [
        { userId: 'user-david-004', role: 'admin', status: 'accepted', joinedAt: daysAgo(35) },
        { userId: 'user-gabrielle-007', role: 'member', status: 'accepted', joinedAt: daysAgo(28) },
        { userId: 'user-francois-006', role: 'member', status: 'accepted', joinedAt: daysAgo(25) },
        { userId: 'user-alice-001', role: 'member', status: 'accepted', joinedAt: daysAgo(20) },
    ];

    for (const m of team1Members) {
        await prisma.teamMember.upsert({
            where: { teamId_userId: { teamId: team1.id, userId: m.userId } },
            update: {},
            create: { teamId: team1.id, ...m },
        });
    }

    for (const m of team2Members) {
        await prisma.teamMember.upsert({
            where: { teamId_userId: { teamId: team2.id, userId: m.userId } },
            update: {},
            create: { teamId: team2.id, ...m },
        });
    }

    // Bataille entre les deux équipes
    const battle = await prisma.battle.upsert({
        where: { id: 'battle-winter-001' },
        update: {},
        create: {
            id: 'battle-winter-001',
            name: 'Défi Hiver 2026',
            description: 'Quelle équipe économisera le plus de CO2 cet hiver ?',
            startDate: daysAgo(30),
            endDate: daysAgo(0),
            isActive: true,
            createdAt: daysAgo(30),
            updatedAt: daysAgo(0),
        },
    });

    await prisma.teamBattle.upsert({
        where: { battleId_teamId: { battleId: battle.id, teamId: team1.id } },
        update: {},
        create: {
            battleId: battle.id,
            teamId: team1.id,
            co2SavedDuringBattle: 180.5,
            rank: 1,
            joinedAt: daysAgo(30),
        },
    });

    await prisma.teamBattle.upsert({
        where: { battleId_teamId: { battleId: battle.id, teamId: team2.id } },
        update: {},
        create: {
            battleId: battle.id,
            teamId: team2.id,
            co2SavedDuringBattle: 155.2,
            rank: 2,
            joinedAt: daysAgo(30),
        },
    });

    // Paliers de récompenses d'équipe
    const teamRewards = [
        { teamId: team1.id, threshold: 100, cosmeticId: 'avatar-avatar-2', isUnlocked: true, unlockedAt: daysAgo(40) as Date | null },
        { teamId: team1.id, threshold: 500, cosmeticId: 'avatar-avatar-5', isUnlocked: true, unlockedAt: daysAgo(10) as Date | null },
        { teamId: team1.id, threshold: 1000, cosmeticId: 'avatar-avatar-8', isUnlocked: false, unlockedAt: null as Date | null },
        { teamId: team2.id, threshold: 100, cosmeticId: 'avatar-avatar-3', isUnlocked: true, unlockedAt: daysAgo(20) as Date | null },
        { teamId: team2.id, threshold: 500, cosmeticId: 'avatar-avatar-6', isUnlocked: false, unlockedAt: null as Date | null },
    ];

    for (const tr of teamRewards) {
        await prisma.teamRewardThreshold.upsert({
            where: { teamId_threshold: { teamId: tr.teamId, threshold: tr.threshold } },
            update: {},
            create: tr,
        });
    }

    console.log('2 équipes, 9 membres, 1 bataille, 5 paliers créés');
}

// ============================================
// SEED : POSTS, LIKES, COMMENTAIRES
// ============================================

async function seedSocialInteractions() {
    console.log('Creation des interactions sociales...');

    const posts = [
        {
            id: 'post-001',
            userId: 'user-alice-001',
            type: 'challenge_completed',
            content: { challengeTitle: 'Privilégier le vélo pour vos trajets', co2Saved: 2.5, category: 'transport' },
            createdAt: daysAgo(85),
        },
        {
            id: 'post-002',
            userId: 'user-david-004',
            type: 'achievement',
            content: { type: 'co2_milestone', milestone: 200, message: 'David a économisé 200 kg de CO2 !' },
            createdAt: daysAgo(10),
        },
        {
            id: 'post-003',
            userId: 'user-gabrielle-007',
            type: 'cosmetic_unlock',
            content: { cosmeticName: 'Avatar 8', cosmeticType: 'avatar', source: 'co2_personal' },
            createdAt: daysAgo(2),
        },
        {
            id: 'post-004',
            userId: 'user-bob-002',
            type: 'challenge_completed',
            content: { challengeTitle: 'Utiliser les transports en commun', co2Saved: 1.8, category: 'transport' },
            createdAt: daysAgo(70),
        },
        {
            id: 'post-005',
            userId: 'user-alice-001',
            type: 'achievement',
            content: { type: 'streak_milestone', milestone: 25, message: 'Alice a atteint un streak de 25 jours !' },
            createdAt: daysAgo(30),
        },
        {
            id: 'post-006',
            userId: 'user-claire-003',
            type: 'challenge_completed',
            content: { challengeTitle: 'Repas végétarien', co2Saved: 1.5, category: 'alimentation' },
            createdAt: daysAgo(55),
        },
        {
            id: 'post-007',
            userId: 'user-david-004',
            type: 'challenge_completed',
            content: { challengeTitle: 'Acheter un vélo', co2Saved: 500, category: 'transport' },
            createdAt: daysAgo(10),
        },
        {
            id: 'post-008',
            userId: 'user-francois-006',
            type: 'challenge_completed',
            content: { challengeTitle: 'Faire du covoiturage', co2Saved: 1.2, category: 'transport' },
            createdAt: daysAgo(28),
        },
        {
            id: 'post-009',
            userId: 'user-gabrielle-007',
            type: 'achievement',
            content: { type: 'co2_milestone', milestone: 300, message: 'Gabrielle a économisé 300 kg de CO2 !' },
            createdAt: daysAgo(5),
        },
        {
            id: 'post-010',
            userId: 'user-emma-005',
            type: 'challenge_completed',
            content: { challengeTitle: 'Utiliser les transports en commun', co2Saved: 1.8, category: 'transport' },
            createdAt: daysAgo(40),
        },
    ];

    for (const p of posts) {
        await prisma.post.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                userId: p.userId,
                type: p.type,
                content: p.content,
                createdAt: p.createdAt,
            },
        });
    }

    // Likes
    const likes: Array<{ userId: string; postId: string; createdAt: Date }> = [
        { userId: 'user-bob-002', postId: 'post-001', createdAt: daysAgo(84) },
        { userId: 'user-claire-003', postId: 'post-001', createdAt: daysAgo(84) },
        { userId: 'user-david-004', postId: 'post-001', createdAt: daysAgo(83) },
        { userId: 'user-alice-001', postId: 'post-002', createdAt: daysAgo(9) },
        { userId: 'user-gabrielle-007', postId: 'post-002', createdAt: daysAgo(9) },
        { userId: 'user-bob-002', postId: 'post-002', createdAt: daysAgo(8) },
        { userId: 'user-francois-006', postId: 'post-002', createdAt: daysAgo(8) },
        { userId: 'user-alice-001', postId: 'post-003', createdAt: daysAgo(1) },
        { userId: 'user-david-004', postId: 'post-003', createdAt: daysAgo(1) },
        { userId: 'user-bob-002', postId: 'post-003', createdAt: daysAgo(1) },
        { userId: 'user-claire-003', postId: 'post-003', createdAt: daysAgo(1) },
        { userId: 'user-emma-005', postId: 'post-003', createdAt: daysAgo(1) },
        { userId: 'user-alice-001', postId: 'post-004', createdAt: daysAgo(69) },
        { userId: 'user-david-004', postId: 'post-005', createdAt: daysAgo(29) },
        { userId: 'user-gabrielle-007', postId: 'post-005', createdAt: daysAgo(29) },
        { userId: 'user-bob-002', postId: 'post-005', createdAt: daysAgo(28) },
        { userId: 'user-alice-001', postId: 'post-006', createdAt: daysAgo(54) },
        { userId: 'user-bob-002', postId: 'post-006', createdAt: daysAgo(54) },
        { userId: 'user-alice-001', postId: 'post-007', createdAt: daysAgo(9) },
        { userId: 'user-gabrielle-007', postId: 'post-007', createdAt: daysAgo(9) },
        { userId: 'user-claire-003', postId: 'post-008', createdAt: daysAgo(27) },
        { userId: 'user-david-004', postId: 'post-009', createdAt: daysAgo(4) },
        { userId: 'user-alice-001', postId: 'post-009', createdAt: daysAgo(4) },
        { userId: 'user-bob-002', postId: 'post-010', createdAt: daysAgo(39) },
    ];

    for (const l of likes) {
        await prisma.like.upsert({
            where: { userId_postId: { userId: l.userId, postId: l.postId } },
            update: {},
            create: {
                userId: l.userId,
                postId: l.postId,
                createdAt: l.createdAt,
            },
        });
    }

    // Commentaires
    const comments: Array<{ userId: string; postId: string; content: string; createdAt: Date }> = [
        { userId: 'user-bob-002', postId: 'post-001', content: 'Bravo Alice ! Tu m\'inspires 🚲', createdAt: daysAgo(84) },
        { userId: 'user-claire-003', postId: 'post-001', content: 'Super initiative !', createdAt: daysAgo(83) },
        { userId: 'user-alice-001', postId: 'post-002', content: 'Félicitations David, quel parcours !', createdAt: daysAgo(9) },
        { userId: 'user-gabrielle-007', postId: 'post-002', content: 'Impressionnant 👏', createdAt: daysAgo(9) },
        { userId: 'user-alice-001', postId: 'post-003', content: 'Trop beau cet avatar ! Bien mérité', createdAt: daysAgo(1) },
        { userId: 'user-david-004', postId: 'post-003', content: 'Gg Gabrielle !', createdAt: daysAgo(1) },
        { userId: 'user-alice-001', postId: 'post-004', content: 'Continue comme ça Bob !', createdAt: daysAgo(69) },
        { userId: 'user-bob-002', postId: 'post-005', content: '25 jours, c\'est énorme !', createdAt: daysAgo(28) },
        { userId: 'user-david-004', postId: 'post-005', content: 'Objectif : te dépasser 😄', createdAt: daysAgo(28) },
        { userId: 'user-alice-001', postId: 'post-007', content: 'Bienvenue au club vélo 🚴', createdAt: daysAgo(9) },
        { userId: 'user-francois-006', postId: 'post-009', content: 'Incroyable score !', createdAt: daysAgo(4) },
    ];

    for (const c of comments) {
        await prisma.comment.create({
            data: {
                userId: c.userId,
                postId: c.postId,
                content: c.content,
                createdAt: c.createdAt,
                updatedAt: c.createdAt,
            },
        });
    }

    console.log(`${posts.length} posts, ${likes.length} likes, ${comments.length} commentaires créés`);
}

// ============================================
// SEED : MESSAGES
// ============================================

async function seedMessages() {
    console.log('Création des messages...');

    const messages: Array<{
        senderId: string;
        receiverId: string;
        content: string;
        isRead: boolean;
        createdAt: Date;
    }> = [
            // Conversation Alice <-> Bob
            { senderId: 'user-alice-001', receiverId: 'user-bob-002', content: 'Salut Bob ! Tu as vu le nouveau défi vélo ?', isRead: true, createdAt: daysAgo(60) },
            { senderId: 'user-bob-002', receiverId: 'user-alice-001', content: 'Oui ! Je vais essayer cette semaine', isRead: true, createdAt: daysAgo(60) },
            { senderId: 'user-alice-001', receiverId: 'user-bob-002', content: 'Super, on pourrait faire du covoiturage aussi', isRead: true, createdAt: daysAgo(59) },
            { senderId: 'user-bob-002', receiverId: 'user-alice-001', content: 'Bonne idée, on en reparle demain !', isRead: true, createdAt: daysAgo(59) },

            // Conversation Alice <-> Claire
            { senderId: 'user-claire-003', receiverId: 'user-alice-001', content: 'Merci de m\'avoir invitée dans l\'équipe !', isRead: true, createdAt: daysAgo(49) },
            { senderId: 'user-alice-001', receiverId: 'user-claire-003', content: 'Avec plaisir ! On va faire de grandes choses 💪', isRead: true, createdAt: daysAgo(49) },

            // Conversation David <-> Gabrielle
            { senderId: 'user-david-004', receiverId: 'user-gabrielle-007', content: 'Bienvenue dans le Vélo Club !', isRead: true, createdAt: daysAgo(28) },
            { senderId: 'user-gabrielle-007', receiverId: 'user-david-004', content: 'Merci David ! J\'adore le concept', isRead: true, createdAt: daysAgo(27) },
            { senderId: 'user-david-004', receiverId: 'user-gabrielle-007', content: 'Tu vas voir, on progresse vite ensemble', isRead: true, createdAt: daysAgo(27) },
            { senderId: 'user-gabrielle-007', receiverId: 'user-david-004', content: 'Je suis déjà à 300 kg de CO2 économisés !', isRead: true, createdAt: daysAgo(5) },
            { senderId: 'user-david-004', receiverId: 'user-gabrielle-007', content: 'Bravo ! Tu es la meilleure du groupe 🏆', isRead: false, createdAt: daysAgo(4) },

            // Conversation Bob <-> Emma
            { senderId: 'user-bob-002', receiverId: 'user-emma-005', content: 'Hey Emma, tu avances sur tes défis ?', isRead: true, createdAt: daysAgo(30) },
            { senderId: 'user-emma-005', receiverId: 'user-bob-002', content: 'Un peu moins ces derniers jours, mais je m\'y remets !', isRead: true, createdAt: daysAgo(29) },

            // Conversation François <-> Claire
            { senderId: 'user-francois-006', receiverId: 'user-claire-003', content: 'Tu veux tenter le défi zéro déchet ensemble ?', isRead: true, createdAt: daysAgo(25) },
            { senderId: 'user-claire-003', receiverId: 'user-francois-006', content: 'Carrément ! On se motive mutuellement 😊', isRead: true, createdAt: daysAgo(24) },

            // Messages non lus
            { senderId: 'user-hugo-008', receiverId: 'user-alice-001', content: 'Bonjour Alice ! Je débute sur l\'app, des conseils ?', isRead: false, createdAt: daysAgo(2) },
            { senderId: 'user-gabrielle-007', receiverId: 'user-alice-001', content: 'Alice, tu viens à l\'événement Journée de la Terre ?', isRead: false, createdAt: daysAgo(1) },
        ];

    for (const m of messages) {
        await prisma.message.create({ data: m });
    }

    console.log(`${messages.length} messages créés`);
}

// ============================================
// SEED : NOTIFICATIONS
// ============================================

async function seedNotifications() {
    console.log('Création des notifications...');

    const notifications: Array<{
        userId: string;
        type: string;
        title: string;
        message: string;
        data: Prisma.InputJsonValue | typeof Prisma.JsonNull;
        isRead: boolean;
        createdAt: Date;
    }> = [
            // Demandes d'amitié
            { userId: 'user-alice-001', type: 'friend_request', title: 'Nouvelle demande d\'ami', message: 'Hugo Garnier souhaite devenir votre ami', data: { fromUserId: 'user-hugo-008' }, isRead: false, createdAt: daysAgo(3) },
            { userId: 'user-bob-002', type: 'friend_request', title: 'Nouvelle demande d\'ami', message: 'Hugo Garnier souhaite devenir votre ami', data: { fromUserId: 'user-hugo-008' }, isRead: false, createdAt: daysAgo(2) },

            // Défis complétés
            { userId: 'user-alice-001', type: 'challenge_completed', title: 'Défi terminé !', message: 'Vous avez complété "Réduire le chauffage" et économisé 1.0 kg CO2', data: { challengeId: 'daily-temperature-reduction', co2Saved: 1.0 }, isRead: true, createdAt: daysAgo(50) },
            { userId: 'user-david-004', type: 'challenge_completed', title: 'Défi terminé !', message: 'Vous avez complété "Acheter un vélo" et économisé 500 kg CO2', data: { challengeId: 'annual-bike-purchase', co2Saved: 500 }, isRead: true, createdAt: daysAgo(10) },
            { userId: 'user-gabrielle-007', type: 'challenge_completed', title: 'Défi terminé !', message: 'Vous avez complété "Sacs réutilisables" et économisé 0.1 kg CO2', data: { challengeId: 'daily-reusable-bags', co2Saved: 0.1 }, isRead: true, createdAt: daysAgo(10) },

            // Cosmétiques débloqués
            { userId: 'user-alice-001', type: 'cosmetic_unlocked', title: 'Nouveau cosmétique !', message: 'Vous avez débloqué "Avatar 5" grâce à vos économies de CO2', data: { cosmeticId: 'avatar-avatar-5', source: 'co2_personal' }, isRead: true, createdAt: daysAgo(20) },
            { userId: 'user-david-004', type: 'cosmetic_unlocked', title: 'Nouveau cosmétique !', message: 'Vous avez débloqué "Avatar 6" grâce à vos économies de CO2', data: { cosmeticId: 'avatar-avatar-6', source: 'co2_personal' }, isRead: true, createdAt: daysAgo(8) },
            { userId: 'user-gabrielle-007', type: 'cosmetic_unlocked', title: 'Nouveau cosmétique !', message: 'Vous avez débloqué "Avatar 8" — le plus rare !', data: { cosmeticId: 'avatar-avatar-8', source: 'co2_personal' }, isRead: false, createdAt: daysAgo(2) },
            { userId: 'user-david-004', type: 'cosmetic_unlocked', title: 'Nouveau cosmétique !', message: 'Vous avez débloqué "Pseudo Or" grâce à votre streak', data: { cosmeticId: 'username_color-pseudo-or', source: 'streak' }, isRead: false, createdAt: daysAgo(10) },

            // Invitation équipe
            { userId: 'user-hugo-008', type: 'team_invitation', title: 'Invitation d\'équipe', message: 'Vous avez été invité à rejoindre "Les Écolos"', data: { teamId: 'team-ecolos-001' }, isRead: false, createdAt: daysAgo(3) },

            // Parrainage
            { userId: 'user-alice-001', type: 'referral', title: 'Nouveau filleul !', message: 'Bob Martin a rejoint PolyCarbone grâce à votre parrainage', data: { referredUserId: 'user-bob-002' }, isRead: true, createdAt: daysAgo(75) },
            { userId: 'user-alice-001', type: 'referral', title: 'Nouveau filleul !', message: 'Claire Bernard a rejoint PolyCarbone grâce à votre parrainage', data: { referredUserId: 'user-claire-003' }, isRead: true, createdAt: daysAgo(60) },
            { userId: 'user-david-004', type: 'referral', title: 'Nouveau filleul !', message: 'Emma Petit a rejoint PolyCarbone grâce à votre parrainage', data: { referredUserId: 'user-emma-005' }, isRead: true, createdAt: daysAgo(45) },

            // Milestones
            { userId: 'user-gabrielle-007', type: 'achievement', title: 'Palier atteint !', message: 'Vous avez économisé 300 kg de CO2 au total !', data: { milestone: 300 }, isRead: false, createdAt: daysAgo(5) },
            { userId: 'user-david-004', type: 'achievement', title: 'Palier atteint !', message: 'Vous avez économisé 200 kg de CO2 au total !', data: { milestone: 200 }, isRead: true, createdAt: daysAgo(10) },
            { userId: 'user-alice-001', type: 'achievement', title: 'Palier atteint !', message: 'Vous avez atteint un streak de 25 jours consécutifs !', data: { streakDays: 25 }, isRead: true, createdAt: daysAgo(30) },
        ];

    for (const n of notifications) {
        await prisma.notification.create({ data: n });
    }

    console.log(`${notifications.length} notifications créées`);
}

// ============================================
// SEED : CONNEXIONS (historique de login)
// ============================================

async function seedConnections() {
    console.log('Création de l\'historique de connexions...');

    let count = 0;
    for (const u of USERS) {
        const accountAgeDays = Math.round(
            (new Date('2026-02-24').getTime() - u.createdAt.getTime()) / 86400000,
        );
        // ~1 connexion tous les 2-3 jours, max 30
        const nbConnections = Math.min(Math.floor(accountAgeDays / 2.5), 30);
        for (let i = 0; i < nbConnections; i++) {
            const dayOffset = Math.floor(Math.random() * accountAgeDays);
            await prisma.connection.create({
                data: {
                    userId: u.id,
                    ipAddress: `192.168.1.${10 + Math.floor(Math.random() * 240)}`,
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    createdAt: daysAgo(dayOffset),
                },
            });
            count++;
        }
    }

    console.log(`${count} connexions créées`);
}

// ============================================
// SEED : MÉTRIQUES APP
// ============================================

async function seedAppMetrics() {
    console.log('Creation des metriques applicatives...');

    const metrics = [
        { date: daysAgo(90), activeUsers: 1, avgFriendsPerUser: 0, avgChallengesPerUser: 0, avgLoginFrequency: 1, totalCO2SavedGlobal: 0 },
        { date: daysAgo(75), activeUsers: 2, avgFriendsPerUser: 0.5, avgChallengesPerUser: 1, avgLoginFrequency: 1.2, totalCO2SavedGlobal: 15 },
        { date: daysAgo(60), activeUsers: 4, avgFriendsPerUser: 1.5, avgChallengesPerUser: 2, avgLoginFrequency: 1.5, totalCO2SavedGlobal: 85 },
        { date: daysAgo(45), activeUsers: 6, avgFriendsPerUser: 2.2, avgChallengesPerUser: 3, avgLoginFrequency: 1.8, totalCO2SavedGlobal: 250 },
        { date: daysAgo(30), activeUsers: 7, avgFriendsPerUser: 2.8, avgChallengesPerUser: 4.5, avgLoginFrequency: 2.0, totalCO2SavedGlobal: 520 },
        { date: daysAgo(15), activeUsers: 7, avgFriendsPerUser: 3.0, avgChallengesPerUser: 5.2, avgLoginFrequency: 2.2, totalCO2SavedGlobal: 780 },
        { date: daysAgo(0), activeUsers: 8, avgFriendsPerUser: 3.2, avgChallengesPerUser: 6.0, avgLoginFrequency: 2.3, totalCO2SavedGlobal: 1081.6 },
    ];

    for (const m of metrics) {
        await prisma.appMetric.create({ data: m });
    }

    console.log(`${metrics.length} métriques créées`);
}

// ============================================
// NETTOYAGE DE LA BASE
// ============================================

async function cleanDatabase() {
    console.log('Nettoyage de la base de données...');

    // Suppression dans l'ordre inverse des dépendances FK
    await prisma.appMetric.deleteMany();
    await prisma.connection.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.message.deleteMany();
    await prisma.teamBattle.deleteMany();
    await prisma.battle.deleteMany();
    await prisma.teamRewardThreshold.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.userCosmetic.deleteMany();
    await prisma.userChallenge.deleteMany();
    await prisma.carbonFootprintHistory.deleteMany();
    await prisma.carbonFootprint.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.rewardThreshold.deleteMany();
    // Détacher avatars/bannières avant suppression des cosmétiques
    await prisma.user.updateMany({ data: { avatarId: null, bannerId: null } });
    await prisma.user.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.event.deleteMany();
    await prisma.cosmetic.deleteMany();

    console.log('Base de données nettoyée');
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('===== SEED COMPLET DE LA BASE DE DONNÉES =====\n');

    await cleanDatabase();

    console.log('');
    await seedCosmetics();
    await seedChallengesAndEvents();

    console.log('');
    await seedUsers();
    await seedCarbonFootprints();
    await seedUserChallenges();
    await seedUserCosmetics();

    console.log('');
    await seedFriendships();
    await seedTeams();
    await seedSocialInteractions();
    await seedMessages();
    await seedNotifications();
    await seedConnections();
    await seedAppMetrics();

    // Récapitulatif final
    console.log('\n===== RÉCAPITULATIF =====');
    const counts = await Promise.all([
        prisma.user.count(),
        prisma.cosmetic.count(),
        prisma.challenge.count(),
        prisma.event.count(),
        prisma.carbonFootprint.count(),
        prisma.carbonFootprintHistory.count(),
        prisma.userChallenge.count(),
        prisma.userCosmetic.count(),
        prisma.friendship.count(),
        prisma.team.count(),
        prisma.teamMember.count(),
        prisma.battle.count(),
        prisma.post.count(),
        prisma.like.count(),
        prisma.comment.count(),
        prisma.message.count(),
        prisma.notification.count(),
        prisma.connection.count(),
        prisma.appMetric.count(),
    ]);

    const labels = [
        'Utilisateurs', 'Cosmétiques', 'Défis', 'Événements',
        'Empreintes carbone', 'Historiques empreinte', 'Défis utilisateurs', 'Cosmétiques débloqués',
        'Amitiés', 'Équipes', 'Membres d\'équipe', 'Batailles',
        'Posts', 'Likes', 'Commentaires', 'Messages',
        'Notifications', 'Connexions', 'Métriques app',
    ];

    labels.forEach((label, i) => {
        console.log(`   ${label.padEnd(25)} : ${counts[i]}`);
    });

    console.log('\nSeed terminé avec succès !');
    console.log('Tous les utilisateurs utilisent le mot de passe : Password123!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Erreur lors du seed :', e);
        await prisma.$disconnect();
        process.exit(1);
    });
