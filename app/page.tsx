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
import { Calculator, BowArrow, Handshake } from "lucide-react"

export default function Home() {
  return (
    <>
      <div className="p-4">
        {/* Section de bienvenue */}
        <Card className="shadow-lg border-0 bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <Logo className="size-18 mx-auto" width={72} height={72} />
            <CardTitle className="text-3xl font-bold">
              Bienvenue sur PolyCarbone
            </CardTitle>
            <CardDescription className="text-primary-foreground text-base mt-2">
              Réduisez votre empreinte carbone en relevant des défis quotidiens
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/auth/portal?mode=signup">
              <Button size="lg" variant="secondary" className="text-base px-8 py-8 whitespace-normal shadow-md">
                S'inscrire et commencer le bilan carbone
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Section d'explication */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="gap-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="size-4" />
              Calculez votre empreinte carbone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Répondez à notre questionnaire pour connaître votre impact carbone. Obtenez une estimation précise de vos émissions annuelles.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="gap-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BowArrow className="size-4" />
              Relevez des défis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Accomplissez des défis quotidiens adaptés à votre profil. Chaque défi vous aide à réduire votre empreinte carbone.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="gap-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Handshake className="size-4" />
              Partagez avec vos amis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Invitez vos proches et progressez ensemble. Créez des groupes pour vous motiver mutuellement.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
