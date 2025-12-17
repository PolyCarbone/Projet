"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
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

interface CarbonFootprintBarChartProps {
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
    label: {
        color: "hsl(var(--background))",
    },
} satisfies ChartConfig

export function CarbonFootprintBarChart({ data }: CarbonFootprintBarChartProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!data) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                Complétez votre évaluation pour voir les détails.
            </p>
        )
    }

    const chartData = [
        {
            category: "transport",
            label: "Transport",
            value: data.transport ?? 0,
            fill: chartConfig.transport.color,
        },
        {
            category: "alimentation",
            label: "Alimentation",
            value: data.alimentation ?? 0,
            fill: chartConfig.alimentation.color,
        },
        {
            category: "logement",
            label: "Logement",
            value: data.logement ?? 0,
            fill: chartConfig.logement.color,
        },
        {
            category: "servicessocietaux",
            label: "Services sociétaux",
            value: data.serviceSocietal ?? 0,
            fill: chartConfig.servicessocietaux.color,
        },
        {
            category: "divers",
            label: "Divers",
            value: data.divers ?? 0,
            fill: chartConfig.divers.color,
        },
    ]

    const totalFootprint = data.totalFootprint ?? chartData.reduce((sum, item) => sum + item.value, 0)

    if (!isMounted) {
        return (

            <div className="h-[200px] w-full flex flex-col justify-center gap-4">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-4/5" />
                <Skeleton className="h-7 w-3/5" />
                <Skeleton className="h-7 w-2/5" />
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig}>
            <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                    right: 50,
                    left: 20,
                }}
            >
                <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            indicator="line"
                            formatter={(value, name) => (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {
                                            ((): string => {
                                                const configItem = chartConfig[name as keyof typeof chartConfig];
                                                if (configItem && typeof configItem === "object" && "label" in configItem) {
                                                    return configItem.label;
                                                }
                                                return String(name);
                                            })()
                                        }
                                    </span>
                                    <span className="ml-auto">{Number(value).toLocaleString("fr-FR")} kg CO₂e</span>
                                </div>
                            )}
                        />
                    }
                />
                <Bar
                    dataKey="value"
                    layout="vertical"
                    radius={4}
                    barSize={20}
                >
                    <LabelList
                        dataKey="label"
                        position="top"
                        offset={8}
                        className="fill-foreground"
                        fontSize={12}
                    />
                    <LabelList
                        dataKey="value"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        fontSize={12}
                        formatter={(value: number) => `${value.toLocaleString("fr-FR")} kg`}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    )
}
