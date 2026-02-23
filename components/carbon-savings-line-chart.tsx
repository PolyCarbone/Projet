"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

interface CarbonSavingsData {
    date: string
    cumulativeCO2Saved: number
}

interface CarbonSavingsLineChartProps {
    data: CarbonSavingsData[] | null
    isLoading?: boolean
    title?: string
    description?: string
}

const chartConfig = {
    cumulativeCO2Saved: {
        label: "CO2 économisé (kg)",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function CarbonSavingsLineChart({ data, isLoading, title = "Ma Progression", description = "Depuis votre premier défi réalisé" }: CarbonSavingsLineChartProps) {
    if (isLoading) {
        return (
            <Card className="border-none shadow-none">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        {title}
                    </CardTitle>
                    <CardDescription>Chargement...</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Chargement des données...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data || data.length <= 1) {
        return null
    }

    const totalSaved = data[data.length - 1]?.cumulativeCO2Saved || 0

    // Aggregate data by a given period key, keeping the last cumulative value per bucket
    function aggregateBy(
        raw: CarbonSavingsData[],
        keyFn: (d: Date) => string
    ): CarbonSavingsData[] {
        const map = new Map<string, CarbonSavingsData>()
        for (const d of raw) {
            const key = keyFn(new Date(d.date))
            map.set(key, d) // last entry wins (cumulative)
        }
        return Array.from(map.values())
    }

    // Choose granularity based on number of raw data points
    // > 60 days   → group by week
    // > 24 weeks  → group by month
    // > 24 months → group by year
    const getWeekKey = (d: Date) => {
        const jan1 = new Date(d.getFullYear(), 0, 1)
        const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
        return `${d.getFullYear()}-W${week}`
    }
    const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const getYearKey = (d: Date) => `${d.getFullYear()}`

    let chartData: CarbonSavingsData[]
    let tooltipGranularity: "day" | "week" | "month" | "year"

    if (data.length <= 21) {
        chartData = data
        tooltipGranularity = "day"
    } else {
        const byWeek = aggregateBy(data, getWeekKey)
        if (byWeek.length <= 24) {
            chartData = byWeek
            tooltipGranularity = "week"
        } else {
            const byMonth = aggregateBy(data, getMonthKey)
            if (byMonth.length <= 24) {
                chartData = byMonth
                tooltipGranularity = "month"
            } else {
                chartData = aggregateBy(data, getYearKey)
                tooltipGranularity = "year"
            }
        }
    }

    const tooltipLabelFormatter = (value: unknown) => {
        const date = new Date(value as string)
        if (tooltipGranularity === "year") {
            return date.toLocaleDateString("fr-FR", { year: "numeric" })
        }
        if (tooltipGranularity === "month") {
            return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        }
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    }

    const minVal = Math.min(...chartData.map(d => d.cumulativeCO2Saved))
    const maxVal = Math.max(...chartData.map(d => d.cumulativeCO2Saved))
    const range = maxVal - minVal
    const yPadding = range > 0 ? range * 0.25 : (maxVal > 0 ? maxVal * 0.25 : 1)
    const yMin = Math.max(0, Math.round(minVal - yPadding))
    const yMax = Math.round(maxVal + yPadding)

    return (
        <div className="px-4 pb-4 max-w-7xl mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 font-semibold text-base">
                        <TrendingUp className="h-4 w-4" />
                        -{Math.round(totalSaved).toLocaleString("fr-FR")} kg
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[240px] w-full">
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 12,
                                right: 12,
                                top: 12,
                                bottom: 12,
                            }}
                        >
                            <defs>
                                <linearGradient id="fillCO2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-cumulativeCO2Saved)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-cumulativeCO2Saved)" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={60}
                                tickFormatter={(value) => `${Math.round(value).toLocaleString("fr-FR")} kg`}
                                domain={[yMin, yMax]}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent
                                    labelFormatter={tooltipLabelFormatter}
                                    formatter={(value) => [`${Math.round(Number(value)).toLocaleString("fr-FR")} kg CO2`, "Total économisé"]}
                                />}
                            />
                            <Area
                                dataKey="cumulativeCO2Saved"
                                type="linear"
                                stroke="var(--color-cumulativeCO2Saved)"
                                strokeWidth={2}
                                fill="url(#fillCO2)"
                                dot={{
                                    fill: "var(--color-cumulativeCO2Saved)",
                                }}
                                activeDot={{
                                    r: 6,
                                }}
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
