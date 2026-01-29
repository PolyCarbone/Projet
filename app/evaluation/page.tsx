"use client"

import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function EvaluationPage() {
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        // Écouter les messages de l'iframe Nos Gestes Climat
        const handleMessage = async (event: MessageEvent) => {
            // Vérifier que le message vient de nosgestesclimat
            if (!event.origin.includes("nosgestesclimat")) {
                return
            }

            const message = event.data

            // Vérifier que c'est un message de partage de données
            if (typeof message === "string") {
                try {
                    const parsed = JSON.parse(message)
                    if (parsed.messageType === "ngc-iframe-share") {
                        await processNGCData(parsed.data)
                    }
                } catch {
                    // Ce n'est pas du JSON, ignorer
                }
            } else if (message?.messageType === "ngc-iframe-share") {
                await processNGCData(message.data)
            }
        }

        const processNGCData = async (data: any) => {
            // Extraire les données avec les clés courtes (t, a, l, d, s)
            const transport = data?.t ?? null
            const alimentation = data?.a ?? null
            const logement = data?.l ?? null
            const divers = data?.d ?? null
            const serviceSocietal = data?.s ?? null

            // Calculer le bilan total
            const carbonData = data?.footprints?.carbon
            const totalFootprint = carbonData?.bilan ??
                (transport ?? 0) + (alimentation ?? 0) + (logement ?? 0) + (divers ?? 0) + (serviceSocietal ?? 0)

            if (typeof totalFootprint !== "number" || totalFootprint === 0) {
                console.error("Le bilan n'est pas un nombre valide")
                return
            }

            try {
                const response = await fetch("/api/carbon-footprint", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        totalFootprint: totalFootprint,
                        transport: transport,
                        alimentation: alimentation,
                        logement: logement,
                        divers: divers,
                        serviceSocietal: serviceSocietal,
                        rawData: data,
                    }),
                })

                if (response.ok) {
                    alert("Votre bilan carbone a été sauvegardé ! Rendez-vous sur votre profil pour le consulter.")
                } else {
                    console.error("Erreur lors de la sauvegarde:", await response.text())
                    alert("Erreur lors de la sauvegarde du bilan.")
                }
            } catch (error) {
                console.error("Erreur lors de la sauvegarde du bilan:", error)
                alert("Erreur lors de la sauvegarde du bilan.")
            }
        }

        window.addEventListener("message", handleMessage)

        return () => {
            window.removeEventListener("message", handleMessage)
        }
    }, [])

    // Interface plein écran
    if (isFullscreen) {
        return (
            <div className="h-screen w-screen overflow-hidden relative">
                <Button
                    onClick={() => setIsFullscreen(false)}
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 z-50 shadow-lg"
                >
                    <Minimize2 className="h-4 w-4" />
                </Button>

                <iframe
                    id="iframeNosGestesClimat"
                    src={`https://nosgestesclimat.fr/simulateur/bilan?iframe=true&integratorUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&shareData=true&onlySimulation=true`}
                    className="w-full h-full border-none"
                    allow="fullscreen; clipboard-write"
                    allowFullScreen
                    title="Simulateur Nos Gestes Climat"
                />
            </div>
        )
    }

    // Interface normale
    return (
        <div className="h-screen overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white text-center mb-2 drop-shadow-lg">
                            Calculez votre empreinte carbone
                        </h1>
                        <p className="text-white/80 text-center text-sm drop-shadow">
                            Découvrez votre impact environnemental avec le simulateur Nos Gestes Climat de l&apos;ADEME
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsFullscreen(true)}
                        size="icon"
                        variant="secondary"
                        className="ml-4 shadow-lg"
                        title="Plein écran"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 container mx-auto px-4 pb-4 min-h-0">
                    <iframe
                        id="iframeNosGestesClimat"
                        src={`https://nosgestesclimat.fr/simulateur/bilan?iframe=true&integratorUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&shareData=true&onlySimulation=true`}
                        className="w-full h-full border-none rounded-lg"
                        allow="fullscreen; clipboard-write"
                        allowFullScreen
                        title="Simulateur Nos Gestes Climat"
                    />
                </div>
            </div>
        </div>
    )
}
