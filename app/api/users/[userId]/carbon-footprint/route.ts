import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const { userId } = await params

        const carbonFootprint = await prisma.carbonFootprint.findUnique({
            where: { userId },
        })

        if (!carbonFootprint) {
            return NextResponse.json(null)
        }

        return NextResponse.json(carbonFootprint)
    } catch (error) {
        console.error("Error fetching user carbon footprint:", error)
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        )
    }
}
