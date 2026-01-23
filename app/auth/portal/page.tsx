import Link from "next/link"

import { AuthForm } from "@/components/auth-form"
import { Logo } from "@/components/logo"

export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-1 p-6 md:p-10">
                <div className="flex justify-center gap-2 mt-20">
                    <div className="flex flex-col items-center gap-1 font-medium">
                        <Logo className="size-18" width={60} height={60} radiusClass="rounded-full" />
                        <span className="text-lg text-gray-600" >PolyCarbone</span>
                        <div  className="text-lg font-light text-gray-400 tracking-tighter text-center" >Rejoignez la communauté et réduisez votre empreinte carbone</div>
                    </div>
                </div>
                <div className="flex items-start justify-center mt-6">
                    <div className="w-full max-w-xs">
                        <AuthForm defaultMode="login" />
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block">
                <img
                    src="/images/app-background.jpg"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.65]"
                />
            </div>
        </div>
    )
}
