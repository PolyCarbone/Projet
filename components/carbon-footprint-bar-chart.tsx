"use client"

import { Leaf } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
    co2SavedByCategory?: Record<string, number> | null
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
        color: "var(--chart-1)",
    },
    alimentation: {
        label: "Alimentation",
        color: "var(--chart-2)",
    },
    logement: {
        label: "Logement",
        color: "var(--chart-3)",
    },
    servicessocietaux: {
        label: "Services sociétaux",
        color: "var(--chart-4)",
    },
    divers: {
        label: "Divers",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

export function CarbonFootprintBarChart({ data }: CarbonFootprintBarChartProps) {
    const [isMounted, setIsMounted] = useState(false)
    const isMobile = useIsMobile()

    const shortLabels: Record<string, string> = {
        transport: "Transp.",
        alimentation: "Aliment.",
        logement: "Logem.",
        servicessocietaux: "Services",
        divers: "Divers",
    }

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

    const savings = data.co2SavedByCategory ?? {}
    const netValue = (baseline: number | null | undefined, key: string) =>
        Math.max(0, Math.round((baseline ?? 0) - (savings[key] ?? 0)))

    const chartData = [
        {
            category: "transport",
            value: netValue(data.transport, "transport"),
            fill: "var(--color-transport)",
        },
        {
            category: "alimentation",
            value: netValue(data.alimentation, "alimentation"),
            fill: "var(--color-alimentation)",
        },
        {
            category: "logement",
            value: netValue(data.logement, "logement"),
            fill: "var(--color-logement)",
        },
        {
            category: "servicessocietaux",
            value: netValue(data.serviceSocietal, "serviceSocietal"),
            fill: "var(--color-servicessocietaux)",
        },
        {
            category: "divers",
            value: netValue(data.divers, "divers"),
            fill: "var(--color-divers)",
        },
    ]

    const totalSaved = Object.values(savings).reduce((s, v) => s + v, 0)
    const totalFootprint = Math.max(0, Math.round((data.totalFootprint ?? chartData.reduce((sum, item) => sum + item.value, 0)) - totalSaved))

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
        <Card>
            <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
                <CardDescription>Estimation de votre empreinte annuelle</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            interval={0}
                            tickFormatter={(value) =>
                                isMobile
                                    ? (shortLabels[value] ?? value)
                                    : (chartConfig[value as keyof typeof chartConfig]?.label ?? value)
                            }
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    formatter={(value, _name, item) => (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {chartConfig[item.payload.category as keyof typeof chartConfig]?.label ?? item.payload.category}
                                            </span>
                                            <span className="ml-auto">
                                                {Number(value).toLocaleString("fr-FR")} kg CO₂e
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Bar
                            dataKey="value"
                            strokeWidth={2}
                            radius={8}
                            activeBar={({ ...props }) => (
                                <Rectangle
                                    {...props}
                                    fillOpacity={0.8}
                                    stroke={props.payload.fill}
                                    strokeDasharray={4}
                                    strokeDashoffset={4}
                                />
                            )}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Total net : {totalFootprint.toLocaleString("fr-FR")} kg CO₂e
                    <Leaf className="h-4 w-4" />
                </div>
                {totalSaved > 0 && (
                    <div className="text-muted-foreground">
                        Dont {totalSaved.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kg CO₂e économisés grâce aux défis
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
