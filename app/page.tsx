import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Logo } from "@/components/logo";

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Section de bienvenue */}
      <Card>
        <CardHeader className="text-center">
          <Logo className="size-18 mx-auto" width={60} height={60} />
          <CardTitle className="text-3m font-bold">
            Bienvenue sur PolyCarbonne
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Réduisez votre empreinte carbone en relevant des défis quotidiens
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/evaluation">
            <Button size="lg" className="text-lg p-4 py-8 whitespace-normal">
              S'inscrire et commencer mon test carbone
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Section d'explication */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1. Calculez votre empreinte carbone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Répondez à notre questionnaire pour connaître votre impact carbone
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2. Relevez des défis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Accomplissez des défis quotidiens adaptés à votre profil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">3. Partagez avec vos amis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
            Invitez vos proches et progressez ensemble
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
