#!/usr/bin/env tsx

/**
 * Script de synchronisation des défis et événements
 * 
 * Ce script met à jour la base de données avec les défis et événements
 * définis dans les fichiers de configuration JSON.
 * 
 * Usage:
 *   npm run sync-challenges
 *   
 * Options:
 *   --dry-run : Affiche les changements sans les appliquer
 *   --force : Force la mise à jour même si des défis existent déjà
 */

import { config } from 'dotenv'
import { PrismaClient } from '../lib/generated/prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Charger les variables d'environnement
config()

const prisma = new PrismaClient()

interface ChallengeConfig {
    id: string
    title: string
    description: string
    category: string
    type: string
    co2Impact: number
    isActive: boolean
}

interface EventChallengeConfig {
    id: string
    title: string
    description: string
    category: string
    co2Impact: number
}

interface EventConfig {
    id: string
    name: string
    description: string
    startDate: string
    endDate: string
    isActive: boolean
    challenges: EventChallengeConfig[]
}

interface ChallengesData {
    challenges: ChallengeConfig[]
}

interface EventsData {
    events: EventConfig[]
}

// Options en ligne de commande
const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')

async function loadConfig() {
    const configDir = path.join(__dirname, '..', 'config')

    const challengesPath = path.join(configDir, 'challenges.json')
    const eventsPath = path.join(configDir, 'events.json')

    console.log('📂 Chargement des fichiers de configuration...')

    const challengesData: ChallengesData = JSON.parse(
        fs.readFileSync(challengesPath, 'utf-8')
    )

    const eventsData: EventsData = JSON.parse(
        fs.readFileSync(eventsPath, 'utf-8')
    )

    console.log(`✅ ${challengesData.challenges.length} défis chargés`)
    console.log(`✅ ${eventsData.events.length} événements chargés`)

    return { challengesData, eventsData }
}

async function syncChallenges(challenges: ChallengeConfig[]) {
    console.log('\n🔄 Synchronisation des défis...')

    let created = 0
    let updated = 0
    let skipped = 0

    for (const challengeConfig of challenges) {
        try {
            // Vérifier si le défi existe déjà
            const existing = await prisma.challenge.findFirst({
                where: { id: challengeConfig.id }
            })

            const data = {
                title: challengeConfig.title,
                description: challengeConfig.description,
                category: challengeConfig.category,
                type: challengeConfig.type,
                co2Impact: challengeConfig.co2Impact,
                isActive: challengeConfig.isActive,
            }

            if (existing) {
                if (isForce) {
                    if (isDryRun) {
                        console.log(`  [DRY-RUN] Mise à jour: ${challengeConfig.title}`)
                    } else {
                        await prisma.challenge.update({
                            where: { id: challengeConfig.id },
                            data
                        })
                        console.log(`  ✏️  Mis à jour: ${challengeConfig.title}`)
                    }
                    updated++
                } else {
                    console.log(`  ⏭️  Déjà existant: ${challengeConfig.title}`)
                    skipped++
                }
            } else {
                if (isDryRun) {
                    console.log(`  [DRY-RUN] Création: ${challengeConfig.title}`)
                } else {
                    await prisma.challenge.create({
                        data: {
                            id: challengeConfig.id,
                            ...data
                        }
                    })
                    console.log(`  ✨ Créé: ${challengeConfig.title}`)
                }
                created++
            }
        } catch (error) {
            console.error(`  ❌ Erreur pour ${challengeConfig.title}:`, error)
        }
    }

    console.log(`\n📊 Résumé des défis:`)
    console.log(`   - Créés: ${created}`)
    console.log(`   - Mis à jour: ${updated}`)
    console.log(`   - Ignorés: ${skipped}`)

    return { created, updated, skipped }
}

async function syncEvents(events: EventConfig[]) {
    console.log('\n🔄 Synchronisation des événements...')

    let created = 0
    let updated = 0
    let skipped = 0
    let challengesCreated = 0

    for (const eventConfig of events) {
        try {
            // Vérifier si l'événement existe déjà
            const existing = await prisma.event.findFirst({
                where: { id: eventConfig.id }
            })

            const eventData = {
                name: eventConfig.name,
                description: eventConfig.description,
                startDate: new Date(eventConfig.startDate),
                endDate: new Date(eventConfig.endDate),
                isActive: eventConfig.isActive,
            }

            let eventId: string

            if (existing) {
                if (isForce) {
                    if (isDryRun) {
                        console.log(`  [DRY-RUN] Mise à jour événement: ${eventConfig.name}`)
                        eventId = existing.id
                    } else {
                        const updatedEvent = await prisma.event.update({
                            where: { id: eventConfig.id },
                            data: eventData
                        })
                        console.log(`  ✏️  Événement mis à jour: ${eventConfig.name}`)
                        eventId = updatedEvent.id
                    }
                    updated++
                } else {
                    console.log(`  ⏭️  Événement déjà existant: ${eventConfig.name}`)
                    eventId = existing.id
                    skipped++
                }
            } else {
                if (isDryRun) {
                    console.log(`  [DRY-RUN] Création événement: ${eventConfig.name}`)
                    eventId = eventConfig.id
                } else {
                    const newEvent = await prisma.event.create({
                        data: {
                            id: eventConfig.id,
                            ...eventData
                        }
                    })
                    console.log(`  ✨ Événement créé: ${eventConfig.name}`)
                    eventId = newEvent.id
                }
                created++
            }

            // Synchroniser les défis liés à l'événement
            for (const challengeConfig of eventConfig.challenges) {
                try {
                    const challengeExists = await prisma.challenge.findFirst({
                        where: { id: challengeConfig.id }
                    })

                    const challengeData = {
                        title: challengeConfig.title,
                        description: challengeConfig.description,
                        category: challengeConfig.category,
                        type: 'event',
                        co2Impact: challengeConfig.co2Impact,
                        isActive: eventConfig.isActive,
                        eventId: eventId,
                    }

                    if (challengeExists) {
                        if (isForce && !isDryRun) {
                            await prisma.challenge.update({
                                where: { id: challengeConfig.id },
                                data: challengeData
                            })
                            console.log(`    ✏️  Défi mis à jour: ${challengeConfig.title}`)
                        } else if (isDryRun) {
                            console.log(`    [DRY-RUN] Mise à jour défi: ${challengeConfig.title}`)
                        } else {
                            console.log(`    ⏭️  Défi existant: ${challengeConfig.title}`)
                        }
                    } else {
                        if (isDryRun) {
                            console.log(`    [DRY-RUN] Création défi: ${challengeConfig.title}`)
                        } else {
                            await prisma.challenge.create({
                                data: {
                                    id: challengeConfig.id,
                                    ...challengeData
                                }
                            })
                            console.log(`    ✨ Défi créé: ${challengeConfig.title}`)
                        }
                        challengesCreated++
                    }
                } catch (error) {
                    console.error(`    ❌ Erreur pour le défi ${challengeConfig.title}:`, error)
                }
            }
        } catch (error) {
            console.error(`  ❌ Erreur pour l'événement ${eventConfig.name}:`, error)
        }
    }

    console.log(`\n📊 Résumé des événements:`)
    console.log(`   - Événements créés: ${created}`)
    console.log(`   - Événements mis à jour: ${updated}`)
    console.log(`   - Événements ignorés: ${skipped}`)
    console.log(`   - Défis d'événements créés: ${challengesCreated}`)

    return { created, updated, skipped, challengesCreated }
}

async function main() {
    console.log('🚀 Démarrage de la synchronisation des défis et événements\n')

    if (isDryRun) {
        console.log('⚠️  MODE DRY-RUN: Aucune modification ne sera appliquée\n')
    }

    if (isForce) {
        console.log('⚠️  MODE FORCE: Les défis et événements existants seront mis à jour\n')
    }

    try {
        // Charger les configurations
        const { challengesData, eventsData } = await loadConfig()

        // Synchroniser les défis
        await syncChallenges(challengesData.challenges)

        // Synchroniser les événements
        await syncEvents(eventsData.events)

        console.log('\n✅ Synchronisation terminée avec succès!')

        if (isDryRun) {
            console.log('\n💡 Exécutez sans --dry-run pour appliquer les modifications')
        }

    } catch (error) {
        console.error('\n❌ Erreur lors de la synchronisation:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
