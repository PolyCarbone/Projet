"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
}

const chartConfig = {
    cumulativeCO2Saved: {
        label: "CO2 économisé (kg)",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

export function CarbonSavingsLineChart({ data, isLoading }: CarbonSavingsLineChartProps) {
    if (isLoading) {
        return (
            <Card className="border-none shadow-none">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Ma Progression
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

    if (!data || data.length === 0) {
        return (
            <Card className="border-none shadow-none">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Ma Progression
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="flex items-center justify-center">
                        <p className="text-muted-foreground">
                            Aucune donnée disponible. Complétez des défis pour voir votre progression !
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    }

    const totalSaved = data[data.length - 1]?.cumulativeCO2Saved || 0
    const firstValue = data[0]?.cumulativeCO2Saved || 0
    const lastValue = data[data.length - 1]?.cumulativeCO2Saved || 0
    const percentageIncrease = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100).toFixed(1) : "0"

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Ma Progression
                </CardTitle>
                <CardDescription>
                    Depuis votre premier défi réalisé
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `${value} kg`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                labelFormatter={(value) => {
                                    const date = new Date(value as string)
                                    return date.toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })
                                }}
                                formatter={(value) => [`${Number(value).toFixed(2)} kg CO2`, "Total économisé"]}
                            />}
                        />
                        <Line
                            dataKey="cumulativeCO2Saved"
                            type="monotone"
                            stroke="var(--color-cumulativeCO2Saved)"
                            strokeWidth={2}
                            dot={{
                                fill: "var(--color-cumulativeCO2Saved)",
                                r: 3,
                            }}
                            activeDot={{
                                r: 5,
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <div className="px-6 pb-6 flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Total économisé : {totalSaved.toFixed(2)} kg CO2 <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mt-2">
                    Progression depuis vos défis réalisés
                </div>
            </div>
        </Card>
    )
}
