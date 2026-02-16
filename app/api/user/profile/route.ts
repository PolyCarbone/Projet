import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { email } from "better-auth";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                username: true,
                createdAt: true,
                updatedAt: true,
                avatarId: true,
                avatar: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true
                    }
                },
                avatarBorderColor: true,
                bannerId: true,
                banner: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true
                    }
                },
                usernameColor: true,
                darkMode: true,
                totalCO2Saved: true,
                currentStreak: true,
                longestStreak: true,
                lastActivityDate: true,
                referralCode: true,
                isAdmin: true,
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
            headers: await headers(),
        });
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { username, bannerId, avatarId } = body;

    // Mise à jour dynamique : Prisma ne modifiera que les champs fournis
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(username && { username }),
        ...(bannerId && { bannerId }),
        ...(avatarId && { avatarId }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
