export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-700">
            {children}
        </div>
    )
}
