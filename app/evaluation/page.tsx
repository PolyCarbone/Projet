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

    return (
        <div className="h-full w-full overflow-hidden">
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
