"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Users,
    Trophy,
    LogIn,
    Leaf,
    Activity,
    ShieldCheck,
    TrendingUp,
    Loader2,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from "recharts"
import { useAuth } from "@/lib/auth-context"
import { useUserProfile } from "@/lib/user-profile-context"

interface ChartDataPoint {
    date: string
    value: number
}

interface AdminStats {
    currentStats: {
        totalUsers: number
        avgFriendsPerUser: number
        avgChallengesLast7Days: number
        avgLoginFrequency: number
        totalCO2Saved: number
        activeUsersLastMonth: number
    }
    charts: {
        friends: ChartDataPoint[]
        challenges: ChartDataPoint[]
        loginFrequency: ChartDataPoint[]
        co2Reduction: ChartDataPoint[]
        activeUsers: ChartDataPoint[]
    }
}

// Configurations des graphiques
const friendsChartConfig = {
    value: {
        label: "Amis moyens / utilisateur",
        color: "hsl(220, 70%, 60%)",
    },
} satisfies ChartConfig

const challengesChartConfig = {
    value: {
        label: "Défis moyens / utilisateur",
        color: "hsl(280, 65%, 60%)",
    },
} satisfies ChartConfig

const loginChartConfig = {
    value: {
        label: "Fréquence connexion",
        color: "hsl(35, 85%, 55%)",
    },
} satisfies ChartConfig

const co2ChartConfig = {
    value: {
        label: "CO₂ économisé (kg)",
        color: "hsl(140, 65%, 45%)",
    },
} satisfies ChartConfig

const activeUsersChartConfig = {
    value: {
        label: "Utilisateurs actifs",
        color: "hsl(200, 70%, 55%)",
    },
} satisfies ChartConfig

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
    })
}

// Composant carte KPI avec graphique
function KpiCard({
    title,
    description,
    value,
    unit,
    icon: Icon,
    chartData,
    chartConfig,
    chartType = "area",
    iconColor,
}: {
    title: string
    description: string
    value: string | number
    unit: string
    icon: React.ElementType
    chartData: ChartDataPoint[]
    chartConfig: ChartConfig
    chartType?: "area" | "bar" | "line"
    iconColor: string
}) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {title}
                        </CardTitle>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-bold">
                                {value}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {unit}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`rounded-full p-3 ${iconColor}`}
                    >
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-2 overflow-hidden">
                {chartData.length > 0 ? (
                    <ChartContainer
                        config={chartConfig}
                        className="h-[160px] sm:h-[200px] w-full"
                    >
                        {chartType === "area" ? (
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient
                                        id={`fill-${title}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor={
                                                chartConfig.value.color
                                            }
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={
                                                chartConfig.value.color
                                            }
                                            stopOpacity={0.05}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickMargin={8}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickMargin={4}
                                    width={35}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(label) =>
                                                formatDate(label)
                                            }
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={chartConfig.value.color}
                                    strokeWidth={2}
                                    fill={`url(#fill-${title})`}
                                />
                            </AreaChart>
                        ) : chartType === "bar" ? (
                            <BarChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickMargin={8}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickMargin={4}
                                    width={35}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(label) =>
                                                formatDate(label)
                                            }
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="value"
                                    fill={chartConfig.value.color}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        ) : (
                            <LineChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickMargin={8}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={11}
                                    tickMargin={4}
                                    width={35}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(label) =>
                                                formatDate(label)
                                            }
                                        />
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={chartConfig.value.color}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        )}
                    </ChartContainer>
                ) : (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                        Aucune donnée disponible
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const router = useRouter()
    const { session, isLoading: isAuthLoading } = useAuth()
    const { profile, isLoading: isProfileLoading } = useUserProfile()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Vérification d'accès admin
    useEffect(() => {
        if (!isAuthLoading && !session?.user) {
            router.push("/auth/portal?mode=login")
        }
    }, [isAuthLoading, session, router])

    useEffect(() => {
        if (
            !isProfileLoading &&
            profile &&
            !profile.isAdmin
        ) {
            router.push("/home")
        }
    }, [isProfileLoading, profile, router])

    // Chargement des statistiques
    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch("/api/admin/stats")
                if (response.status === 403) {
                    router.push("/home")
                    return
                }
                if (!response.ok) {
                    throw new Error("Erreur lors du chargement des statistiques")
                }
                const data = await response.json()
                setStats(data)
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Erreur inconnue"
                )
            } finally {
                setIsLoading(false)
            }
        }

        if (session?.user && profile && profile.isAdmin) {
            fetchStats()
        }
    }, [session, profile, router])

    // États de chargement
    if (isAuthLoading || isProfileLoading || isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                        Chargement du tableau de bord...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-center text-destructive">
                            {error}
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* En-tête */}
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary p-3">
                    <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg sm:text-3xl font-bold">
                        Tableau de bord administrateur
                    </h1>
                    <p className="text-muted-foreground">
                        Suivi des indicateurs clés de performance (KPI)
                        de l&apos;application
                    </p>
                </div>
            </div>

            {/* Résumé rapide */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardContent className="px-2 pt-3 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Utilisateurs
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                            {stats.currentStats.totalUsers}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="px-2 pt-3 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Amis / user
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                            {stats.currentStats.avgFriendsPerUser}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="px-2 pt-3 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Défis / user
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                            {stats.currentStats.avgChallengesLast7Days}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="px-2 pt-3 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Connexions
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                            {stats.currentStats.avgLoginFrequency}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="px-2 pt-3 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            CO₂ (kg)
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                            {stats.currentStats.totalCO2Saved.toLocaleString(
                                "fr-FR"
                            )}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="px-2 pt-3 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Actifs (30j)
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                            {stats.currentStats.activeUsersLastMonth}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques KPI */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Amis par utilisateur */}
                <KpiCard
                    title="Amis par utilisateur"
                    description="Nombre moyen d'amis par utilisateur sur les 30 derniers jours"
                    value={stats.currentStats.avgFriendsPerUser}
                    unit="amis en moyenne"
                    icon={Users}
                    chartData={stats.charts.friends}
                    chartConfig={friendsChartConfig}
                    chartType="area"
                    iconColor="bg-blue-500"
                />

                {/* 2. Défis réalisés par utilisateur */}
                <KpiCard
                    title="Défis réalisés / utilisateur"
                    description="Nombre moyen de défis complétés par utilisateur (7 derniers jours)"
                    value={stats.currentStats.avgChallengesLast7Days}
                    unit="défis en moyenne"
                    icon={Trophy}
                    chartData={stats.charts.challenges}
                    chartConfig={challengesChartConfig}
                    chartType="bar"
                    iconColor="bg-purple-500"
                />

                {/* 3. Fréquence de connexion */}
                <KpiCard
                    title="Fréquence de connexion"
                    description="Fréquence de connexion moyenne par utilisateur (7 derniers jours)"
                    value={stats.currentStats.avgLoginFrequency}
                    unit="connexions en moyenne"
                    icon={LogIn}
                    chartData={stats.charts.loginFrequency}
                    chartConfig={loginChartConfig}
                    chartType="line"
                    iconColor="bg-amber-500"
                />

                {/* 4. Réduction CO2 globale */}
                <KpiCard
                    title="Réduction CO₂ globale"
                    description="Réduction cumulée du CO₂ grâce à l'application (30 derniers jours)"
                    value={stats.currentStats.totalCO2Saved.toLocaleString(
                        "fr-FR"
                    )}
                    unit="kg CO₂"
                    icon={Leaf}
                    chartData={stats.charts.co2Reduction}
                    chartConfig={co2ChartConfig}
                    chartType="area"
                    iconColor="bg-green-600"
                />

                {/* 5. Utilisateurs actifs */}
                <KpiCard
                    title="Utilisateurs actifs"
                    description="Nombre d'utilisateurs actifs par jour (30 derniers jours)"
                    value={stats.currentStats.activeUsersLastMonth}
                    unit="utilisateurs actifs ce mois"
                    icon={Activity}
                    chartData={stats.charts.activeUsers}
                    chartConfig={activeUsersChartConfig}
                    chartType="bar"
                    iconColor="bg-cyan-500"
                />
            </div>
        </div>
    )
}
