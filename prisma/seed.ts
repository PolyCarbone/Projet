import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { COSMETICS_CONFIG } from './cosmetics-config';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Début du seeding...');

    // ============================================
    // SEED DES COSMÉTIQUES
    // ============================================
    console.log('📦 Création des cosmétiques...');

    for (const cosmetic of COSMETICS_CONFIG) {
        await prisma.cosmetic.upsert({
            where: {
                // Utiliser un identifiant unique basé sur le type et le nom
                id: `${cosmetic.type}-${cosmetic.name.toLowerCase().replace(/\s+/g, '-')}`,
            },
            update: {
                type: cosmetic.type,
                name: cosmetic.name,
                imageUrl: cosmetic.imageUrl || null,
                colorValue: cosmetic.colorValue || null,
            },
            create: {
                id: `${cosmetic.type}-${cosmetic.name.toLowerCase().replace(/\s+/g, '-')}`,
                type: cosmetic.type,
                name: cosmetic.name,
                imageUrl: cosmetic.imageUrl || null,
                colorValue: cosmetic.colorValue || null,
            },
        });
    }

    const cosmeticsCount = await prisma.cosmetic.count();
    console.log(`✅ ${cosmeticsCount} cosmétiques créés/mis à jour`);

    // ============================================
    // STATISTIQUES
    // ============================================
    const avatarsCount = await prisma.cosmetic.count({
        where: { type: 'avatar' },
    });
    const bordersCount = await prisma.cosmetic.count({
        where: { type: 'border' },
    });
    const bannersCount = await prisma.cosmetic.count({
        where: { type: 'banner' },
    });
    const usernameColorsCount = await prisma.cosmetic.count({
        where: { type: 'username_color' },
    });

    console.log('\n📊 Statistiques :');
    console.log(`   - Avatars : ${avatarsCount}`);
    console.log(`   - Bordures : ${bordersCount}`);
    console.log(`   - Bannières : ${bannersCount}`);
    console.log(`   - Couleurs de pseudo : ${usernameColorsCount}`);

    console.log('\n✨ Seeding terminé avec succès !');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Erreur lors du seeding :', e);
        await prisma.$disconnect();
        process.exit(1);
    });
