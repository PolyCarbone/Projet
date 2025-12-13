"use client"

import dynamic from "next/dynamic"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

interface CarbonFootprintData {
    transport?: number | null
    alimentation?: number | null
    logement?: number | null
    divers?: number | null
    totalFootprint?: number
}

interface CarbonFootprintChartProps {
    data: CarbonFootprintData | null
}

const chartConfig = {
    value: {
        label: "kg CO₂e",
    },
    transport: {
        label: "Transport",
        color: "hsl(var(--chart-1))",
    },
    alimentation: {
        label: "Alimentation",
        color: "hsl(var(--chart-2))",
    },
    logement: {
        label: "Logement",
        color: "hsl(var(--chart-3))",
    },
    divers: {
        label: "Divers",
        color: "hsl(var(--chart-4))",
    },
} satisfies ChartConfig

export function CarbonFootprintChart({ data }: CarbonFootprintChartProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!data) {
        return (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-black/60 border-zinc-200/50 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle>Empreinte Carbone</CardTitle>
                    <CardDescription>Aucune donnée disponible</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Complétez votre évaluation pour voir votre empreinte carbone.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const chartData = [
        {
            category: "Transport",
            value: data.transport ?? 0,
            fill: "var(--color-transport)",
        },
        {
            category: "Alimentation",
            value: data.alimentation ?? 0,
            fill: "var(--color-alimentation)",
        },
        {
            category: "Logement",
            value: data.logement ?? 0,
            fill: "var(--color-logement)",
        },
        {
            category: "Divers",
            value: data.divers ?? 0,
            fill: "var(--color-divers)",
        },
    ]

    const totalFootprint = data.totalFootprint ?? chartData.reduce((sum, item) => sum + item.value, 0)

    // Afficher un skeleton pendant le premier rendu côté client pour éviter les erreurs d'hydratation
    if (!isMounted) {
        return (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-black/60 border-zinc-200/50 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle>Empreinte Carbone</CardTitle>
                    <CardDescription>
                        Total : {totalFootprint.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kg CO₂e / an
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full flex flex-col justify-center gap-4">
                        <Skeleton className="h-7 w-full" />
                        <Skeleton className="h-7 w-4/5" />
                        <Skeleton className="h-7 w-3/5" />
                        <Skeleton className="h-7 w-2/5" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-black/60 border-zinc-200/50 dark:border-zinc-800">
            <CardHeader>
                <CardTitle>Empreinte Carbone</CardTitle>
                <CardDescription>
                    Total : {totalFootprint.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kg CO₂e / an
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 0, right: 16 }}
                    >
                        <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={90}
                            tickMargin={8}
                        />
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value.toLocaleString("fr-FR")} kg`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => (
                                        <span>{Number(value).toLocaleString("fr-FR")} kg CO₂e</span>
                                    )}
                                />
                            }
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            barSize={28}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
