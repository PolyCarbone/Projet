"use client"
import { Label, Pie, PieChart } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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

interface CarbonFootprintChartProps {
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

export function CarbonFootprintPieChart({ data }: CarbonFootprintChartProps) {
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
        return null
    }

    const savings = data.co2SavedByCategory ?? {}
    const netValue = (baseline: number | null | undefined, key: string) =>
        Math.max(0, Math.round((baseline ?? 0) - (savings[key] ?? 0)))

    const chartData = [
        {
            category: "transport",
            label: "Transport",
            value: netValue(data.transport, "transport"),
            fill: "var(--color-transport)",
        },
        {
            category: "alimentation",
            label: "Alimentation",
            value: netValue(data.alimentation, "alimentation"),
            fill: "var(--color-alimentation)",
        },
        {
            category: "logement",
            label: "Logement",
            value: netValue(data.logement, "logement"),
            fill: "var(--color-logement)",
        },
        {
            category: "servicessocietaux",
            label: "Services sociétaux",
            value: netValue(data.serviceSocietal, "serviceSocietal"),
            fill: "var(--color-servicessocietaux)",
        },
        {
            category: "divers",
            label: "Divers",
            value: netValue(data.divers, "divers"),
            fill: "var(--color-divers)",
        },
    ]

    const totalSaved = Object.values(savings).reduce((s, v) => s + v, 0)
    const totalFootprint = Math.max(0, Math.round((data.totalFootprint ?? chartData.reduce((sum, item) => sum + item.value, 0)) - totalSaved))

    if (!isMounted) {
        return null
    }

    const RADIAN = Math.PI / 180

    const renderCustomLabel = ({
        cx, cy, midAngle, outerRadius, payload,
    }: {
        cx: number; cy: number; midAngle: number; outerRadius: number; payload: { category: string }
    }) => {
        const radialLen = isMobile ? 10 : 20
        const horizontalLen = isMobile ? 10 : 20
        const elbowRadius = outerRadius + radialLen
        const x0 = cx + (outerRadius + 4) * Math.cos(-midAngle * RADIAN)
        const y0 = cy + (outerRadius + 4) * Math.sin(-midAngle * RADIAN)
        const x1 = cx + elbowRadius * Math.cos(-midAngle * RADIAN)
        const y1 = cy + elbowRadius * Math.sin(-midAngle * RADIAN)
        const isRight = x1 >= cx
        const x2 = isRight ? x1 + horizontalLen : x1 - horizontalLen
        const y2 = y1
        const label = isMobile
            ? (shortLabels[payload.category] ?? payload.category)
            : (chartConfig[payload.category as keyof typeof chartConfig]?.label ?? payload.category)
        return (
            <g>
                <polyline
                    points={`${x0},${y0} ${x1},${y1} ${x2},${y2}`}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    fill="none"
                    opacity={0.8}
                />
                <text
                    x={isRight ? x2 + 4 : x2 - 4}
                    y={y2}
                    textAnchor={isRight ? "start" : "end"}
                    dominantBaseline="middle"
                    fontSize={12}
                    className="fill-foreground"
                >
                    {label}
                </text>
            </g>
        )
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Répartition par catégorie</CardTitle>
                <CardDescription>Estimation de votre empreinte annuelle</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="h-[240px] w-full [&_svg]:overflow-visible"
                >
                    <PieChart margin={{ top: 30, right: 70, bottom: 30, left: 70 }}>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    formatter={(value, name) => (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {chartConfig[name as keyof typeof chartConfig]?.label ?? String(name)}
                                            </span>
                                            <span className="ml-auto">
                                                {Number(value).toLocaleString("fr-FR")} kg CO₂e
                                            </span>
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
                            outerRadius={85}
                            strokeWidth={5}
                            label={renderCustomLabel}
                            labelLine={false}
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
                                                    {totalFootprint.toLocaleString("fr-FR")}
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