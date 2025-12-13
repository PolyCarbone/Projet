import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username");

        if (!username) {
            return NextResponse.json(
                { error: "Username requis" },
                { status: 400 }
            );
        }

        // Vérifier si le pseudo existe déjà
        const existingUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: "insensitive", // Case insensitive
                }
            }
        });

        return NextResponse.json({
            available: !existingUser,
        });
    } catch (error) {
        console.error("Error checking username:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
