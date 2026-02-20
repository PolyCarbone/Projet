import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Génère un tableau de données journalières pour les N derniers jours.
 */
function generateDailyData(
    days: number,
    getValue: (endOfDay: Date, startOfDay: Date) => number
) {
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(23, 59, 59, 999)

        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)

        data.push({
            date: dayStart.toISOString().split("T")[0],
            value: parseFloat(getValue(date, dayStart).toFixed(2)),
        })
    }

    return data
}

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            )
        }

        // Vérifier que l'utilisateur est administrateur
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        })

        if (!user?.isAdmin) {
            return NextResponse.json(
                { error: "Accès non autorisé" },
                { status: 403 }
            )
        }

        const now = new Date()
        const sevenDaysAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
        )
        const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
        )

        // ============ STATISTIQUES ACTUELLES ============

        // Nombre total d'utilisateurs
        const totalUsers = await prisma.user.count()

        // 1. Nombre d'amis moyen par utilisateur
        const totalFriendships = await prisma.friendship.count({
            where: { status: "accepted" },
        })
        // Chaque amitié compte pour 2 utilisateurs
        const avgFriendsPerUser =
            totalUsers > 0 ? (totalFriendships * 2) / totalUsers : 0

        // 2. Nombre de défis réalisés par utilisateur en moyenne (7 derniers jours)
        const challengesLast7Days = await prisma.userChallenge.count({
            where: {
                status: "completed",
                completedAt: { gte: sevenDaysAgo },
            },
        })
        const avgChallengesLast7Days =
            totalUsers > 0 ? challengesLast7Days / totalUsers : 0

        // 3. Fréquence de connexion moyenne (7 derniers jours)
        const connectionsLast7Days = await prisma.connection.count({
            where: {
                createdAt: { gte: sevenDaysAgo },
            },
        })
        const avgLoginFrequency =
            totalUsers > 0 ? connectionsLast7Days / totalUsers : 0

        // 4. Réduction CO2 globale
        const co2Result = await prisma.user.aggregate({
            _sum: { totalCO2Saved: true },
        })
        const totalCO2Saved = co2Result._sum.totalCO2Saved || 0

        // 5. Utilisateurs actifs sur le dernier mois
        const activeUsersLastMonth = await prisma.connection.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
            select: { userId: true },
            distinct: ["userId"],
        })
        const activeUsersCount = activeUsersLastMonth.length

        // ============ DONNÉES DES GRAPHIQUES ============

        // --- Historique amis (30 jours) ---
        const friendshipsHistory = await prisma.friendship.findMany({
            where: { status: "accepted" },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        })

        const usersHistory = await prisma.user.findMany({
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        })

        const friendsChartData = generateDailyData(30, (date) => {
            const friendsUpToDate = friendshipsHistory.filter(
                (f) => f.createdAt <= date
            ).length
            const usersUpToDate = usersHistory.filter(
                (u) => u.createdAt <= date
            ).length
            return usersUpToDate > 0
                ? (friendsUpToDate * 2) / usersUpToDate
                : 0
        })

        // --- Historique défis (7 jours) ---
        const challengesHistory = await prisma.userChallenge.findMany({
            where: {
                status: "completed",
                completedAt: { gte: sevenDaysAgo, not: null },
            },
            select: { completedAt: true },
        })

        const challengesChartData = generateDailyData(7, (date, dayStart) => {
            const challengesOnDay = challengesHistory.filter(
                (c) =>
                    c.completedAt &&
                    c.completedAt >= dayStart &&
                    c.completedAt <= date
            ).length
            return totalUsers > 0 ? challengesOnDay / totalUsers : 0
        })

        // --- Fréquence de connexion (7 jours) ---
        const connectionsHistory = await prisma.connection.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
            },
            select: { createdAt: true, userId: true },
        })

        const loginChartData = generateDailyData(7, (date, dayStart) => {
            return connectionsHistory.filter(
                (c) => c.createdAt >= dayStart && c.createdAt <= date
            ).length
        })

        // --- Réduction CO2 globale (30 jours) ---
        const allCompletedChallenges = await prisma.userChallenge.findMany({
            where: {
                status: "completed",
                co2Saved: { gt: 0 },
                completedAt: { not: null },
            },
            select: { completedAt: true, co2Saved: true },
            orderBy: { completedAt: "asc" },
        })

        const co2ChartData = generateDailyData(30, (date) => {
            return allCompletedChallenges
                .filter((c) => c.completedAt && c.completedAt <= date)
                .reduce((sum, c) => sum + (c.co2Saved || 0), 0)
        })

        // --- Utilisateurs actifs (30 jours) ---
        const allConnections30Days = await prisma.connection.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
            select: { createdAt: true, userId: true },
        })

        const activeUsersChartData = generateDailyData(
            30,
            (date, dayStart) => {
                return new Set(
                    allConnections30Days
                        .filter(
                            (c) =>
                                c.createdAt >= dayStart &&
                                c.createdAt <= date
                        )
                        .map((c) => c.userId)
                ).size
            }
        )

        return NextResponse.json({
            currentStats: {
                totalUsers,
                avgFriendsPerUser: parseFloat(avgFriendsPerUser.toFixed(2)),
                avgChallengesLast7Days: parseFloat(
                    avgChallengesLast7Days.toFixed(2)
                ),
                avgLoginFrequency: parseFloat(avgLoginFrequency.toFixed(2)),
                totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
                activeUsersLastMonth: activeUsersCount,
            },
            charts: {
                friends: friendsChartData,
                challenges: challengesChartData,
                loginFrequency: loginChartData,
                co2Reduction: co2ChartData,
                activeUsers: activeUsersChartData,
            },
        })
    } catch (error) {
        console.error("Error fetching admin stats:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des statistiques" },
            { status: 500 }
        )
    }
}
