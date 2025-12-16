import Image from "next/image"

interface LogoProps {
    className?: string
    width?: number
    height?: number
}

export function Logo({ className = "size-4", width = 16, height = 16 }: LogoProps) {
    return (
        <Image
            src="/images/LogoPolycarbone.png"
            alt="PolyCarbone Logo"
            width={width}
            height={height}
            className={`rounded-full ${className}`}
        />
    )
}
