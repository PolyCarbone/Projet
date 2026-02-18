import { AuthForm } from "@/components/auth-form"
import { Logo } from "@/components/logo"

export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-1 lg:place-items-center">
            <div className="flex flex-col gap-1 p-6 md:p-10 w-full lg:max-w-md">
                <div className="flex justify-center gap-2">
                    <div className="flex flex-col items-center gap-1 font-medium">
                        <Logo className="size-18" width={40} height={40} radiusClass="rounded-full" />
                        <span className="text-lg text-gray-600" >PolyCarbone</span>
                        <div className="text-lg font-light text-gray-400 tracking-tighter text-center" >Rejoignez la communauté et réduisez votre empreinte carbone</div>
                    </div>
                </div>
                <div className="flex items-start justify-center mt-6">
                    <div className="w-full max-w-xs">
                        <AuthForm defaultMode="login" />
                    </div>
                </div>
            </div>
        </div>
    )
}
