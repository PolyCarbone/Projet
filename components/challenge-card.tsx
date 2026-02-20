import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Leaf, Calendar, CheckCircle2, XCircle, Repeat, Dices } from "lucide-react"

interface ChallengeCardProps {
    challenge: {
        id: string
        title: string
        description: string
        category: string
        type: string
        co2Impact: number
        event?: {
            id: string
            name: string
            startDate: Date
            endDate: Date
        } | null
        userStatus?: {
            id: string
            status: string
            startedAt: Date
            completedAt?: Date | null
            co2Saved?: number | null
            wasChanged: boolean
        } | null
    }
    onComplete?: () => void
    onSkip?: () => void
    onChange?: () => void
    onReroll?: () => void
}

const categoryColors: Record<string, string> = {
    transport: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    alimentation: "bg-green-500/10 text-green-700 dark:text-green-300",
    logement: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    divers: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    serviceSocietal: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
}

const categoryLabels: Record<string, string> = {
    transport: "Transport",
    alimentation: "Alimentation",
    logement: "Logement",
    divers: "Divers",
    serviceSocietal: "Service Sociétal",
}

export function ChallengeCard({ challenge, onComplete, onSkip, onChange, onReroll }: ChallengeCardProps) {
    const status = challenge.userStatus?.status || 'available'

    return (
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold leading-tight line-clamp-1">{challenge.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold whitespace-nowrap shrink-0">
                        <Leaf className="size-3" />
                        <span className="text-xs">{challenge.co2Impact} kg</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-2 px-3 flex-1">
                <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${categoryColors[challenge.category]}`}>
                        {categoryLabels[challenge.category] || challenge.category}
                    </Badge>
                    {challenge.event && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                            <Calendar className="size-2.5" />
                            {challenge.event.name}
                        </Badge>
                    )}
                </div>

                {challenge.userStatus?.completedAt && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Complété le {new Date(challenge.userStatus.completedAt).toLocaleDateString('fr-FR')}
                        {challenge.userStatus.co2Saved && (
                            <span className="ml-1 text-green-600 dark:text-green-400 font-medium">
                                — {challenge.userStatus.co2Saved} kg CO₂
                            </span>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="gap-1.5 px-3 pb-3 pt-0">
                {(status === 'available' || status === 'active') && onComplete && (
                    <Button onClick={onComplete} size="sm" className="flex-1 text-xs h-7">
                        <CheckCircle2 className="size-3 mr-1" />
                        Complété
                    </Button>
                )}
                {status === 'active' && onReroll && challenge.type === 'daily' && (
                    <Button onClick={onReroll} variant="outline" size="sm" className="h-7 w-7 p-0" title="Re-roll">
                        <Dices className="size-3" />
                    </Button>
                )}
                {status === 'active' && onChange && !onReroll && (
                    <Button onClick={onChange} variant="outline" size="sm" className="h-7 w-7 p-0">
                        <Repeat className="size-3" />
                    </Button>
                )}
                {status === 'active' && onSkip && (
                    <Button onClick={onSkip} variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <XCircle className="size-3" />
                    </Button>
                )}

                {status === 'completed' && (
                    <div className="flex-1 text-center py-1 text-xs font-medium text-green-600 dark:text-green-400">
                        ✓ Complété
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
