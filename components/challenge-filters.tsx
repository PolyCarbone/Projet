import { Badge } from "@/components/ui/badge"

interface ChallengeFiltersProps {
    selectedType: string | null
    selectedCategory: string | null
    selectedStatus: string | null
    onTypeChange: (type: string | null) => void
    onCategoryChange: (category: string | null) => void
    onStatusChange: (status: string | null) => void
}

const types = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'annual', label: 'Annuel' },
    { value: 'event', label: 'Événement' },
]

const categories = [
    { value: 'transport', label: 'Transport' },
    { value: 'alimentation', label: 'Alimentation' },
    { value: 'logement', label: 'Logement' },
    { value: 'divers', label: 'Divers' },
    { value: 'serviceSocietal', label: 'Service Sociétal' },
]

const statuses = [
    { value: 'available', label: 'Disponible' },
    { value: 'active', label: 'En cours' },
    { value: 'completed', label: 'Complété' },
]

export function ChallengeFilters({
    selectedType,
    selectedCategory,
    selectedStatus,
    onTypeChange,
    onCategoryChange,
    onStatusChange,
}: ChallengeFiltersProps) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">Type de défi</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant={selectedType === null ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onTypeChange(null)}
                    >
                        Tous
                    </Badge>
                    {types.map((type) => (
                        <Badge
                            key={type.value}
                            variant={selectedType === type.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => onTypeChange(type.value)}
                        >
                            {type.label}
                        </Badge>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-2">Catégorie</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant={selectedCategory === null ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onCategoryChange(null)}
                    >
                        Toutes
                    </Badge>
                    {categories.map((category) => (
                        <Badge
                            key={category.value}
                            variant={selectedCategory === category.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => onCategoryChange(category.value)}
                        >
                            {category.label}
                        </Badge>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-2">Statut</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant={selectedStatus === null ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onStatusChange(null)}
                    >
                        Tous
                    </Badge>
                    {statuses.map((status) => (
                        <Badge
                            key={status.value}
                            variant={selectedStatus === status.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => onStatusChange(status.value)}
                        >
                            {status.label}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}
