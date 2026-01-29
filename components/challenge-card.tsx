import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Leaf, Calendar, CheckCircle2, XCircle, Clock, Repeat } from "lucide-react"

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
    onAccept?: () => void
    onComplete?: () => void
    onSkip?: () => void
    onChange?: () => void
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

const typeLabels: Record<string, string> = {
    daily: "Quotidien",
    annual: "Annuel",
    event: "Événement",
}

const statusLabels: Record<string, { label: string; icon: any; color: string }> = {
    proposed: { label: "Proposé", icon: Clock, color: "bg-gray-500/10 text-gray-700 dark:text-gray-300" },
    active: { label: "En cours", icon: Clock, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    completed: { label: "Complété", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
    skipped: { label: "Ignoré", icon: XCircle, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
    changed: { label: "Changé", icon: Repeat, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
}

export function ChallengeCard({ challenge, onAccept, onComplete, onSkip, onChange }: ChallengeCardProps) {
    const status = challenge.userStatus?.status || 'available'
    const StatusIcon = status !== 'available' && statusLabels[status] ? statusLabels[status].icon : null

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <CardDescription className="mt-1">{challenge.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                        <Leaf className="size-4" />
                        <span className="text-sm">{challenge.co2Impact} kg</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={categoryColors[challenge.category]}>
                        {categoryLabels[challenge.category] || challenge.category}
                    </Badge>
                    <Badge variant="outline">
                        {typeLabels[challenge.type] || challenge.type}
                    </Badge>
                    {challenge.userStatus && (
                        <Badge className={statusLabels[status]?.color}>
                            <div className="flex items-center gap-1">
                                {StatusIcon && <StatusIcon className="size-3" />}
                                {statusLabels[status]?.label || status}
                            </div>
                        </Badge>
                    )}
                    {challenge.event && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {challenge.event.name}
                        </Badge>
                    )}
                </div>

                {challenge.userStatus?.completedAt && (
                    <div className="mt-3 text-sm text-muted-foreground">
                        Complété le {new Date(challenge.userStatus.completedAt).toLocaleDateString('fr-FR')}
                        {challenge.userStatus.co2Saved && (
                            <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                {challenge.userStatus.co2Saved} kg CO₂ économisés
                            </span>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="gap-2">
                {status === 'available' && onAccept && (
                    <Button onClick={onAccept} className="flex-1">
                        Accepter le défi
                    </Button>
                )}

                {status === 'active' && (
                    <>
                        {onComplete && (
                            <Button onClick={onComplete} className="flex-1">
                                <CheckCircle2 className="size-4 mr-2" />
                                Marquer comme complété
                            </Button>
                        )}
                        {onChange && (
                            <Button onClick={onChange} variant="outline">
                                <Repeat className="size-4" />
                            </Button>
                        )}
                        {onSkip && (
                            <Button onClick={onSkip} variant="ghost">
                                <XCircle className="size-4" />
                            </Button>
                        )}
                    </>
                )}

                {status === 'completed' && challenge.userStatus?.co2Saved && (
                    <div className="flex-1 text-center py-2 text-sm font-medium text-green-600 dark:text-green-400">
                        ✓ Défi complété !
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
