"use client"

import dynamic from "next/dynamic"
import { Label, Pie, PieChart } from "recharts"
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
    serviceSocietal?: number | null
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
        color: "hsl(200, 70%, 70%)", // bleu clair
    },
    alimentation: {
        label: "Alimentation",
        color: "hsl(25, 85%, 65%)", // orange clair
    },
    servicessocietaux: {
        label: "Services sociétaux",
        color: "hsl(270, 60%, 70%)", // violet clair
    },
    logement: {
        label: "Logement",
        color: "hsl(140, 55%, 65%)", // vert clair
    },
    divers: {
        label: "Divers",
        color: "hsl(45, 90%, 55%)", // jaune un peu foncé
    },
} satisfies ChartConfig

export function CarbonFootprintPieChart({ data }: CarbonFootprintChartProps) {
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
            category: "transport",
            label: "Transport",
            value: data.transport ?? 0,
            fill: "var(--color-transport)",
        },
        {
            category: "alimentation",
            label: "Alimentation",
            value: data.alimentation ?? 0,
            fill: "var(--color-alimentation)",
        },
        {
            category: "logement",
            label: "Logement",
            value: data.logement ?? 0,
            fill: "var(--color-logement)",
        },
        {
            category: "servicessocietaux",
            label: "Services sociétaux",
            value: data.serviceSocietal ?? 0,
            fill: "var(--color-servicessocietaux)",
        },
        {
            category: "divers",
            label: "Divers",
            value: data.divers ?? 0,
            fill: "var(--color-divers)",
        },
    ]

    const totalFootprint = data.totalFootprint ?? chartData.reduce((sum, item) => sum + item.value, 0)

    // Afficher un skeleton pendant le premier rendu côté client pour éviter les erreurs d'hydratation
    if (!isMounted) {
        return (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-black/60 border-zinc-200/50 dark:border-zinc-800">
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
            <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    formatter={(value, name) => (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                                            <span className="ml-auto">{Number(value).toLocaleString("fr-FR")} kg CO₂e</span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="category"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalFootprint.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    kg CO₂e
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
