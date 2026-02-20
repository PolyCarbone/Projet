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

    const chartData = [
        {
            category: "transport",
            value: Math.round(data.transport ?? 0),
            fill: "var(--color-transport)",
        },
        {
            category: "alimentation",
            value: Math.round(data.alimentation ?? 0),
            fill: "var(--color-alimentation)",
        },
        {
            category: "logement",
            value: Math.round(data.logement ?? 0),
            fill: "var(--color-logement)",
        },
        {
            category: "servicessocietaux",
            value: Math.round(data.serviceSocietal ?? 0),
            fill: "var(--color-servicessocietaux)",
        },
        {
            category: "divers",
            value: Math.round(data.divers ?? 0),
            fill: "var(--color-divers)",
        },
    ]

    const totalFootprint = Math.round(data.totalFootprint ?? chartData.reduce((sum, item) => sum + item.value, 0))

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
                    Total : {totalFootprint.toLocaleString("fr-FR")} kg CO₂e
                    <Leaf className="h-4 w-4" />
                </div>
            </CardFooter>
        </Card>
    )
}
